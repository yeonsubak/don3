import { useGlobalContext } from '@/app/app/global-context';
import { Form } from '@/components/ui/form';
import { QUERIES } from '@/lib/tanstack-queries';
import { getTransactionService } from '@/services/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { AccountField } from '../fields/account-field';
import { AmountCurrencyField } from '../fields/amount-currency-field';
import { CountryField } from '../fields/country-field';
import { DateField } from '../fields/date-field';
import { DescriptionField } from '../fields/description-field';
import { TimeField } from '../fields/time-field';
import { TitleField } from '../fields/title-field';
import { mapAccounts, type AccountComboItem, type TxFormProps } from './common';
import { expenseTxForm, type ExpenseTxForm } from './form-schema';

export const ExpenseForm = ({ footer, onSuccess }: TxFormProps) => {
  const { countriesInUse, defaultCurrency } = useGlobalContext();
  const curDate = DateTime.now();
  const form = useForm<ExpenseTxForm>({
    resolver: zodResolver(expenseTxForm),
    defaultValues: {
      date: curDate.toJSDate(),
      time: { hour: curDate.get('hour'), minute: curDate.get('minute') },
      journalEntryType: 'expense',
      currencyCode: defaultCurrency?.code ?? 'USD',
      amount: '',
      fxRate: '',
      fxAmount: '',
      title: '',
      description: '',
      debitAccountId: -1,
      creditAccountId: -1,
      countryCode: countriesInUse.at(0)?.code ?? '',
      isFx: false,
    },
  });

  const {
    data: { assetGroupsByCountry, liabilityGroupsByCountry, expenseGroupsByCountry },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.accounts.accountGroupsByCountry('asset'),
      QUERIES.accounts.accountGroupsByCountry('liability'),
      QUERIES.accounts.accountGroupsByCountry('expense'),
    ],
    combine: (results) => ({
      data: {
        assetGroupsByCountry: results[0].data,
        liabilityGroupsByCountry: results[1].data,
        expenseGroupsByCountry: results[2].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [paidByAccounts, setPaidByAccounts] = useState<AccountComboItem[]>([]);
  const [categoryAccounts, setCategoryAccounts] = useState<AccountComboItem[]>([]);

  const countryCodeWatch = useWatch({ control: form.control, name: 'countryCode' });
  useEffect(() => {
    if (assetGroupsByCountry && liabilityGroupsByCountry) {
      const assets = mapAccounts(assetGroupsByCountry, countryCodeWatch);
      const liabilities = mapAccounts(liabilityGroupsByCountry, countryCodeWatch);
      setPaidByAccounts([...assets, ...liabilities]);
    }
  }, [countryCodeWatch, assetGroupsByCountry, liabilityGroupsByCountry]);
  useEffect(() => {
    if (expenseGroupsByCountry) {
      const expenses = mapAccounts(expenseGroupsByCountry, countryCodeWatch);
      setCategoryAccounts(expenses);
    }
  }, [countryCodeWatch, expenseGroupsByCountry]);

  const onSubmit = async (form: ExpenseTxForm) => {
    const transactionService = await getTransactionService();
    if (!transactionService) throw new Error('TransactionService must be initialized first');

    const insertedEntry = await transactionService.insertTransaction(form);
    if (!insertedEntry) throw new Error('Error ocurred while on inserting the transaction.');

    await onSuccess(insertedEntry);
  };

  if (isError) return error.map((e) => <p key={e?.name}>Error: ${e?.message}</p>);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4">
        <div className="grid grid-cols-2 grid-rows-1 gap-3">
          <DateField zForm={form} />
          <TimeField zForm={form} />
        </div>
        <CountryField zForm={form} />
        <div className="grid grid-cols-2 grid-rows-1 gap-3">
          <AccountField
            label="Paid by"
            fieldName="debitAccountId"
            accountItems={paidByAccounts}
            zForm={form}
          />
          <AccountField
            label="Category"
            fieldName="creditAccountId"
            accountItems={categoryAccounts}
            zForm={form}
          />
        </div>
        <AmountCurrencyField
          currencyFieldName="currencyCode"
          amountFieldName="amount"
          fxRateFieldName="fxRate"
          fxAmountFieldName="fxAmount"
          isFxFieldName="isFx"
          zForm={form}
        />
        <TitleField zForm={form} />
        <DescriptionField zForm={form} />
        {footer}
      </form>
    </Form>
  );
};

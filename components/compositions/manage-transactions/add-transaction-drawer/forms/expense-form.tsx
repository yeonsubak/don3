import { useGlobalContext } from '@/app/app/global-context';
import { TransactionService } from '@/app/services/transaction-service';
import { SkeletonSimple } from '@/components/primitives/skeleton-simple';
import { QUERIES } from '@/components/tanstack-queries';
import { Form } from '@/components/ui/form';
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
  const { countriesInUse } = useGlobalContext();

  const curDate = DateTime.now();
  const form = useForm<ExpenseTxForm>({
    resolver: zodResolver(expenseTxForm),
    defaultValues: {
      date: curDate.toJSDate(),
      time: { hour: curDate.get('hour'), minute: curDate.get('minute') },
      journalEntryType: 'expense',
      currencyCode: countriesInUse?.at(0)?.defaultCurrency?.code ?? 'USD',
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
      QUERIES.accounts.getAccountGroupsByCountry('asset'),
      QUERIES.accounts.getAccountGroupsByCountry('liability'),
      QUERIES.accounts.getAccountGroupsByCountry('expense'),
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
    const transactionService = await TransactionService.getInstance<TransactionService>();
    const insertedEntry = await transactionService.insertExpenseTransaction(form);
    if (!insertedEntry) throw new Error('Error ocurred while on inserting the transaction.');

    await onSuccess([insertedEntry]);
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

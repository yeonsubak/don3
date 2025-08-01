import { useGlobalContext } from '@/app/app/global-context';
import { Form } from '@/components/ui/form';
import { QUERIES } from '@/lib/tanstack-queries';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTransactionDrawerContext } from '../../../transaction-drawer-context';
import { AccountField } from '../fields/account-field';
import { AmountCurrencyField } from '../fields/amount-currency-field';
import { CountryField } from '../fields/country-field';
import { DateField } from '../fields/date-field';
import { DescriptionField } from '../fields/description-field';
import { TimeField } from '../fields/time-field';
import { TitleField } from '../fields/title-field';
import { mapAccounts, type AccountComboItem, type TxFormProps } from './common';
import { TransactionDrawerFooter } from './footer';
import { incomeTxForm, type IncomeTxForm } from './form-schema';

export const IncomeForm = ({ onSubmit }: TxFormProps) => {
  const { defaultCurrency, defaultCountry } = useGlobalContext();
  const {
    sharedFormRef: { current: sharedForm },
    setSharedFormRef: setSharedForm,
  } = useTransactionDrawerContext();

  const curDate = DateTime.now();
  const form = useForm<IncomeTxForm>({
    resolver: zodResolver(incomeTxForm),
    defaultValues: {
      id: sharedForm?.id ?? '',
      date: sharedForm?.date ?? curDate.toJSDate(),
      time: sharedForm?.time ?? { hour: curDate.get('hour'), minute: curDate.get('minute') },
      journalEntryType: 'income',
      currencyCode: sharedForm?.currencyCode ?? defaultCurrency?.code ?? 'USD',
      amount: sharedForm?.amount ?? '',
      fxRate: sharedForm?.fxRate ?? '',
      fxAmount: sharedForm?.fxAmount ?? '',
      title: sharedForm?.title ?? '',
      description: sharedForm?.description ?? '',
      debitAccountId: sharedForm?.debitAccountId ?? '',
      creditAccountId: sharedForm?.creditAccountId ?? '',
      countryCode: sharedForm?.countryCode ?? defaultCountry?.code ?? 'USA',
      isFx: sharedForm?.isFx ?? false,
    },
  });

  const formWatch = useWatch({ control: form.control }) as IncomeTxForm;
  useEffect(() => {
    if (!formWatch) return;
    setSharedForm({ ...formWatch });
  }, [formWatch, setSharedForm]);

  const {
    data: { assetGroupsByCountry, incomeGroupsByCountry },
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.accounts.accountGroupsByCountry('asset', false),
      QUERIES.accounts.accountGroupsByCountry('income', false),
    ],
    combine: (results) => ({
      data: {
        assetGroupsByCountry: results[0].data,
        incomeGroupsByCountry: results[1].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [accounts, setAccounts] = useState<AccountComboItem[]>([]);
  const [categoryAccounts, setCategoryAccounts] = useState<AccountComboItem[]>([]);

  const countryCodeWatch = useWatch({ control: form.control, name: 'countryCode' });
  useEffect(() => {
    if (assetGroupsByCountry) {
      const assets = mapAccounts(assetGroupsByCountry, countryCodeWatch);
      setAccounts(assets);
    }
  }, [countryCodeWatch, assetGroupsByCountry]);
  useEffect(() => {
    if (incomeGroupsByCountry) {
      const income = mapAccounts(incomeGroupsByCountry, countryCodeWatch);
      setCategoryAccounts(income);
    }
  }, [countryCodeWatch, incomeGroupsByCountry]);

  if (isError) {
    return error.map((e) => <p key={e?.name}>Error: ${e?.message}</p>);
  }

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
            label="Account"
            fieldName="debitAccountId"
            accountItems={accounts}
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
        <TransactionDrawerFooter zForm={form} />
      </form>
    </Form>
  );
};

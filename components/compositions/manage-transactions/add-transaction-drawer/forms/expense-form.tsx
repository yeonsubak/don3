import { useGlobalContext } from '@/app/app/global-context';
import { TransactionService } from '@/app/services/transaction-service';
import { CountryCombobox } from '@/components/compositions/country-combobox';
import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
} from '@/components/primitives/combobox';
import { SkeletonSimple } from '@/components/primitives/skeleton-simple';
import { QUERIES } from '@/components/tanstack-queries';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AccountSelectWithRelations, CountrySelect } from '@/db/drizzle/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { TimeSelector } from '../../../time-selector';
import { AmountCurrencyField } from '../fields/amount-currency-field';
import { CalendarField } from '../fields/calendar-field';
import { mapAccounts, type TxFormProps } from './common';
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

  const [paidByAccounts, setPaidByAccounts] = useState<ComboboxItem[]>([]);
  const [categoryAccounts, setCategoryAccounts] = useState<ComboboxItem[]>([]);

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

  if (isPending) return <SkeletonSimple heightInPx={97} />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4">
        <div className="grid grid-cols-2 grid-rows-1 gap-3">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <CalendarField field={field} closeOnSelect />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <TimeSelector field={field} zForm={form} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="countryCode"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Country</FormLabel>
              <FormControl>
                <CountryCombobox mode="all" field={field} zForm={form} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 grid-rows-1 gap-3">
          <FormField
            control={form.control}
            name="debitAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid by</FormLabel>
                <FormControl>
                  <Combobox
                    items={paidByAccounts}
                    field={field}
                    zForm={form}
                    onSelectFn={(currentValue) => {
                      const flat = flattenComboboxItems(
                        paidByAccounts,
                      ) as ComboboxItem<AccountSelectWithRelations>[];
                      const paidByAccount = flat.find(
                        (account) => account.value === currentValue,
                      )?.data;
                      if (paidByAccount) {
                        form.setValue('currencyCode', paidByAccount.currency.code);
                      }
                    }}
                    popoverContentClass="w-fit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Combobox
                    items={categoryAccounts}
                    field={field}
                    zForm={form}
                    popoverContentClass="w-fit"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {footer}
      </form>
    </Form>
  );
};

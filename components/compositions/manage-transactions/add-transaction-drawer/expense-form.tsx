import { useGlobalContext } from '@/app/app/global-context';
import { TransactionService } from '@/app/services/transaction-service';
import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
} from '@/components/primitives/combobox';
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
import { useEffect, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { TimeSelector } from '../../time-selector';
import { AmountCurrencyField } from './amount-currency-field';
import { CalendarField } from './calendar-field';
import { mapAccounts } from './common-functions';
import { useTransactionDrawerContext } from './drawer-context';
import { transactionForm, type TransactionForm } from './form-schema';

export const ExpenseForm = ({ footer }: { footer: ReactNode }) => {
  const { countriesInUse } = useGlobalContext();
  const { setOpen, setSelectedCurrency, currencies } = useTransactionDrawerContext();

  const curDate = DateTime.now();
  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionForm),
    defaultValues: {
      date: curDate.toJSDate(),
      time: { hour: curDate.get('hour'), minute: curDate.get('minute') },
      journalEntryType: 'expense',
      currencyCode: countriesInUse?.at(0)?.defaultCurrency?.code ?? 'USD',
      amount: '',
      title: '',
      description: '',
      debitAccountId: -1,
      creditAccountId: -1,
      countryCode: countriesInUse.at(0)?.code ?? '',
    },
  });

  const {
    data: { assetGroupsByCountry, expenseGroupsByCountry },
    isError,
    error,
  } = useQueries({
    queries: [QUERIES.accounts.assetGroupsByCountry, QUERIES.accounts.expenseGroupsByCountry],
    combine: (results) => ({
      data: {
        assetGroupsByCountry: results[0].data,
        expenseGroupsByCountry: results[1].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [countryItems, setCountryItems] = useState<ComboboxItem<CountrySelect>[]>([]);
  const [paidByAccounts, setPaidByAccounts] = useState<ComboboxItem[]>([]);
  const [categoryAccounts, setCategoryAccounts] = useState<ComboboxItem[]>([]);
  const tCountry = useTranslations('countryCode');

  useEffect(() => {
    setCountryItems(
      countriesInUse.map((country) => ({
        label: tCountry(country.code),
        value: country.code,
        data: country,
      })),
    );
  }, [countriesInUse, tCountry]);

  const currencyCodeWatch = useWatch({ control: form.control, name: 'currencyCode' });
  useEffect(() => {
    setSelectedCurrency(currencies.find((currency) => currency.code === currencyCodeWatch));
  }, [currencies, currencyCodeWatch, setSelectedCurrency]);

  const countryCodeWatch = useWatch({ control: form.control, name: 'countryCode' });
  useEffect(() => {
    if (assetGroupsByCountry)
      setPaidByAccounts(mapAccounts(assetGroupsByCountry, countryCodeWatch));
    if (expenseGroupsByCountry)
      setCategoryAccounts(mapAccounts(expenseGroupsByCountry, countryCodeWatch));
    // TODO: Add liability accounts
  }, [countryCodeWatch, assetGroupsByCountry, , expenseGroupsByCountry]);

  if (isError) {
    return error.map((e) => <p key={e?.name}>Error: ${e?.message}</p>);
  }

  const onSubmit = async (form: TransactionForm) => {
    const transactionService = await TransactionService.getInstance<TransactionService>();
    const insertedEntry = await transactionService.insertExpenseTransaction(form);
    console.log('insertedEntry', insertedEntry);
    // TODO: add page update logic
    setOpen(false);
  };

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
                <Combobox
                  items={countryItems}
                  field={field}
                  zForm={form}
                  searchable={false}
                  popoverContentAlign="start"
                  onSelectFn={(currentValue) => {
                    const currencyCode =
                      countriesInUse.find((country) => country.code === currentValue)
                        ?.defaultCurrency?.code ?? 'USD';
                    form.setValue('currencyCode', currencyCode);
                  }}
                />
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

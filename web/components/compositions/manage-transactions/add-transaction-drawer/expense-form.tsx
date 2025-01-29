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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { AccountSelectWithRelations, CountrySelect } from '@/db/drizzle/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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

  const curDate = new Date();
  const curHour = curDate.getHours();
  const curMinute = curDate.getMinutes();

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionForm),
    defaultValues: {
      date: curDate,
      time: { hour: curHour, minute: curMinute },
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

  const currencyCodeWatch = useWatch({ control: form.control, name: 'currencyCode' });
  useEffect(() => {
    setSelectedCurrency(currencies.find((currency) => currency.code === currencyCodeWatch));
  }, [currencies, currencyCodeWatch, setSelectedCurrency]);

  const {
    data: assetGroupsByCountry,
    isPending: isPending1,
    isError: isError1,
    error: error1,
  } = useQuery(QUERIES.accounts.assetGroupsByCountry);
  const {
    data: expenseGroupsByCountry,
    isPending: isPending2,
    isError: isError2,
    error: error2,
  } = useQuery(QUERIES.accounts.expenseGroupsByCountry);

  const [paidByAccounts, setPaidByAccounts] = useState<ComboboxItem[]>([]);
  const [categoryAccounts, setCategoryAccounts] = useState<ComboboxItem[]>([]);
  const tCountry = useTranslations('countryCode');

  const [countryItems, setCountryItems] = useState<ComboboxItem<CountrySelect>[]>([]);

  useEffect(() => {
    setCountryItems(
      countriesInUse.map((country) => ({
        label: tCountry(country.code),
        value: country.code,
        data: country,
      })),
    );
  }, [countriesInUse, tCountry]);

  const countryCodeWatch = useWatch({ control: form.control, name: 'countryCode' });
  useEffect(() => {
    if (assetGroupsByCountry)
      setPaidByAccounts(mapAccounts(assetGroupsByCountry, countryCodeWatch));
    if (expenseGroupsByCountry)
      setCategoryAccounts(mapAccounts(expenseGroupsByCountry, countryCodeWatch));
    // TODO: Add liability accounts
  }, [countryCodeWatch, assetGroupsByCountry, , expenseGroupsByCountry]);

  if (isPending1 || isPending2) {
    return <Skeleton className="min-h-[600px] w-lvh" />;
  }

  if (isError1 || isError2) {
    return [error1, error2].map((error) =>
      error ? <p key={error.name}>Error: {error.message}</p> : <></>,
    );
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

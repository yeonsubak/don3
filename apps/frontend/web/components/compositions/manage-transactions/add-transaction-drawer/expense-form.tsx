import { useGlobalContext } from '@/app/app/global-context';
import { TransactionService } from '@/app/services/transaction-service';
import { parseNumber } from '@/components/common-functions';
import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
} from '@/components/primitives/combobox';
import { QUERIES } from '@/components/tanstack-queries';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { AccountSelectWithRelations, CountrySelect } from '@/db/drizzle/types';
import { PgliteDrizzle } from '@/db/pglite-drizzle';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { TimeSelector } from '../../time-selector';
import { AmountCurrencyField } from './amount-currency-field';
import { mapAccounts } from './common-functions';
import { useTransactionDrawerContext } from './drawer-context';

const formSchema = z.object({
  date: z.date(),
  time: z.object({
    hour: z.coerce.number().gte(0).lte(24),
    minute: z.coerce.number().gte(0).lte(59),
  }),
  currencyCode: z.string().min(3).max(3),
  amount: z
    .string()
    .min(1)
    .default('')
    .refine((val) => parseNumber(val), { message: 'Invalid amount' }),
  title: z.string(),
  description: z.string(),
  debitAccountId: z.coerce.number(),
  creditAccountId: z.coerce.number(),
  countryCode: z.string(), // Not for mutation
});

export type ExpenseTransactionForm = z.infer<typeof formSchema>;

export const ExpenseForm = ({ footer }: { footer: ReactNode }) => {
  const { countriesInUse } = useGlobalContext();
  const { setOpen, selectedCurrency, setSelectedCurrency, currencies } =
    useTransactionDrawerContext();

  const curDate = new Date();
  const curHour = curDate.getHours();
  const curMinute = curDate.getMinutes();

  const form = useForm<ExpenseTransactionForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: curDate,
      time: { hour: curHour, minute: curMinute },
      title: '',
      currencyCode: selectedCurrency?.code ?? '',
      amount: '',
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

  const { data: isDbReady } = useQuery(QUERIES.initializeIndexedDb);
  const {
    data: assetGroupsByCountry,
    isPending: isPending1,
    isError: isError1,
    error: error1,
  } = useQuery({ ...QUERIES.assetGroupsByCountry, enabled: isDbReady });
  const {
    data: expenseGroupsByCountry,
    isPending: isPending2,
    isError: isError2,
    error: error2,
  } = useQuery({ ...QUERIES.expenseGroupsByCountry, enabled: isDbReady });

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
    return <Skeleton className="h-full w-full" />;
  }

  if (isError1 || isError2) {
    return [error1, error2].map((error) =>
      error ? <p key={error.name}>Error: {error.message}</p> : <></>,
    );
  }

  const onSubmit = async (form: ExpenseTransactionForm) => {
    const transactionService = new TransactionService(await PgliteDrizzle.getInstance());
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          'w-full text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value ? (
                          <span>{DateTime.fromJSDate(field.value).toFormat('yyyy. L. d')}</span>
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
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

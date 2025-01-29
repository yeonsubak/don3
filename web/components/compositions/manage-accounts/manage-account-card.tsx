'use client';

import type { AccountList } from '@/app/app/manage-accounts/page';
import { AccountsService } from '@/app/services/accounts-service';
import { ConfigService } from '@/app/services/config-service';
import { Combobox, type ComboboxProps } from '@/components/primitives/combobox';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { accounts } from '@/db/drizzle/schema';
import { _PgliteDrizzle } from '@/db/pglite-drizzle';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AccountTypeToggle } from './account-type-toggle';

export const ACCOUNT_FORM_SCHEMA = z.object({
  accountName: z
    .string()
    .min(1, {
      message: 'Name must be at least 1 character.',
    })
    .max(255, { message: 'Name must be less than 255 characters.' }),
  accountType: z.enum(accounts.type.enumValues),
  currencyCode: z.string().min(3).max(3),
  countryCode: z.string().min(3).max(3),
});

type ManageAccountCardProps = {
  accountList: AccountList;
  setAccountList: Dispatch<SetStateAction<AccountList>>;
};

export const ManageAccountCard = ({ accountList, setAccountList }: ManageAccountCardProps) => {
  const [currencyCombo, setCurrencyCombo] = useState<ComboboxProps>({
    placeholder: 'Select currency...',
    searchPlaceholder: 'Search currency...',
    notFoundPlaceholder: 'No currency found.',
    width: 'w-full',
  });
  const [countryCombo, setCountryCombo] = useState<ComboboxProps>({
    placeholder: 'Select country...',
    searchPlaceholder: 'Search country...',
    notFoundPlaceholder: 'No country found.',
    width: 'w-full',
  });

  useEffect(() => {
    const initializeCombos = async () => {
      const config = new ConfigService(await _PgliteDrizzle.getInstance());
      const currencies = await config.getAllCurrencies();
      setCurrencyCombo((cur) => ({
        ...cur,
        items:
          currencies?.map((currency) => ({ label: currency.name, value: currency.code })) ?? [],
      }));

      const countries = await config.getAllCountries();
      setCountryCombo((cur) => ({
        ...cur,
        items: countries?.map((country) => ({ label: country.name, value: country.code })) ?? [],
      }));
    };

    initializeCombos();
  }, []);

  const form = useForm<z.infer<typeof ACCOUNT_FORM_SCHEMA>>({
    resolver: zodResolver(ACCOUNT_FORM_SCHEMA),
    defaultValues: {
      accountName: '',
      accountType: 'debit',
      currencyCode: '',
      countryCode: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof ACCOUNT_FORM_SCHEMA>) => {
    const service = new AccountsService(await _PgliteDrizzle.getInstance());
    const result = (await service.createAccount(values))?.at(0);
    console.log(result);
    if (result) {
      setAccountList([...accountList, result]);
    }
  };

  console.log('manage-account-card-1');

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Add account</CardTitle>
        <CardDescription>Add account to your book.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent>
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <AccountTypeToggle {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input type="text" id="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Combobox field={field} zForm={form} {...currencyCombo} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Combobox field={field} zForm={form} {...countryCombo} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Add</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

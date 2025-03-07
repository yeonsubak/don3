'use client';

import { useGlobalContext } from '@/app/app/global-context';
import { useServiceContext } from '@/app/app/service-context';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CountryCombobox } from '../country-combobox';
import { CurrencyCombobox } from '../currency-combobox';
import { AccountTypeToggle } from './account-type-toggle';
import { createAccountForm, type CreateAccountForm } from './form-schema';

export const ManageAccountCard = () => {
  const { accounts, setAccounts } = useGlobalContext();
  const { accountsService } = useServiceContext();

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountForm),
    defaultValues: {
      accountName: '',
      accountType: 'debit',
      currencyCode: '',
      countryCode: '',
    },
  });

  const onSubmit = async (form: CreateAccountForm) => {
    if (!accountsService) throw new Error('AccountsService must be initialized first');

    const result = await accountsService.createAccount(form);
    console.log(result);
    if (result) {
      setAccounts([...accounts, result]);
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
                    <CurrencyCombobox field={field} zForm={form} />
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
                    <CountryCombobox mode="all" field={field} zForm={form} />
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

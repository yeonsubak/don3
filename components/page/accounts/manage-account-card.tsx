'use client';

import { useGlobalContext } from '@/app/app/global-context';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getAccountsService } from '@/services/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CountryCombobox } from '../../compositions/country-combobox';
import { CurrencyCombobox } from '../../compositions/currency-combobox';
import { AccountTypeToggle } from './account-type-toggle';
import { createAccountForm, type CreateAccountForm } from './form-schema';

type ManageAccountCardProps = {
  footer: React.ReactNode;
};

export const ManageAccountCard = ({ footer }: ManageAccountCardProps) => {
  const { accounts, setAccounts } = useGlobalContext();

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountForm),
    defaultValues: {
      accountName: '',
      accountType: 'debit',
      currencyCode: '',
      countryCode: '',
      accountGroupId: '',
    },
  });

  const onSubmit = async (form: CreateAccountForm) => {
    const accountsService = await getAccountsService();
    if (!accountsService) throw new Error('AccountsService must be initialized first');

    const result = await accountsService.createAccount(form);
    console.log(result);
    if (result) {
      setAccounts([...accounts, result]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4">
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
        {footer}
      </form>
    </Form>
  );
};

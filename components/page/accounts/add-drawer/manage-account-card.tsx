'use client';

import { useGlobalContext } from '@/app/app/global-context';
import { Combobox, type ComboboxItem } from '@/components/primitives/combobox';
import { Button } from '@/components/ui/button';
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
import type { AccountGroupSelect, AccountGroupType } from '@/db/drizzle/types';
import { getAccountsService } from '@/services/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CountryCombobox } from '../../../compositions/country-combobox';
import { CurrencyCombobox } from '../../../compositions/currency-combobox';
import { AddAccountGroupForm } from '../../groups/add-account-group-form';
import { AccountTypeToggle } from '../account-type-toggle';
import { createAccountForm, type CreateAccountForm } from '../form-schema';
import { useAccountDrawerContext } from './drawer-context';

type ManageAccountCardProps = {
  footer: React.ReactNode;
};

export const ManageAccountCard = ({ footer }: ManageAccountCardProps) => {
  const { setAccounts, accountGroups, currencies, countries } = useGlobalContext();
  const { groupType, countryCode } = useAccountDrawerContext();
  const defaultCurrency = currencies.find(
    (currency) =>
      currency.id === countries.find((country) => country.code === countryCode)?.defaultCurrencyId,
  );
  const [openAddAccountGroup, setOpenAddAccountGroup] = useState(false);

  const accountGroupComboItems = useMemo(
    () => mapAccountGroupsToComboboxItems(accountGroups, groupType),
    [accountGroups, groupType],
  );

  const form = useForm<CreateAccountForm>({
    resolver: zodResolver(createAccountForm),
    defaultValues: {
      accountName: '',
      accountType: groupType === 'asset' ? 'debit' : 'credit',
      currencyCode: defaultCurrency?.code ?? 'USD',
      countryCode: countryCode,
      accountGroupId: '',
    },
  });

  function mapAccountGroupsToComboboxItems(
    _accountGroups: typeof accountGroups,
    groupType: AccountGroupType,
  ): ComboboxItem<AccountGroupSelect>[] {
    return _accountGroups
      .filter((group) => group.type === groupType)
      .map((group) => ({
        label: group.name,
        value: `${group.id}`,
        data: group,
      }));
  }

  async function onSubmit(form: CreateAccountForm) {
    const accountsService = await getAccountsService();
    const result = await accountsService.insertAccount(form);
    console.log(result);
    if (result) {
      setAccounts((prev) => [...prev, result]);
    }
  }

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
                <AccountTypeToggle {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row items-end gap-2">
          <FormField
            control={form.control}
            name="accountGroupId"
            render={({ field }) => (
              <div className="grow">
                <FormItem>
                  <FormLabel>Account Group</FormLabel>
                  <FormControl>
                    <Combobox items={accountGroupComboItems} field={field} zForm={form} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>
            )}
          />
          <Popover open={openAddAccountGroup} onOpenChange={setOpenAddAccountGroup}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Plus weight="bold" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <AddAccountGroupForm
                groupType={groupType}
                submitPostHook={(result) => {
                  setOpenAddAccountGroup(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
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
        {footer}
      </form>
    </Form>
  );
};

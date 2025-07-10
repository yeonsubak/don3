'use client';

import { useGlobalContext } from '@/app/app/global-context';
import { CountryCombobox } from '@/components/compositions/country-combobox';
import { CurrencyCombobox } from '@/components/compositions/currency-combobox';
import { EmojiPicker } from '@/components/compositions/emoji-picker';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { Combobox, type ComboboxItem } from '@/components/primitives/combobox';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
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
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { accounts } from '@/db/app-db/schema';
import type {
  AccountGroupSelect,
  AccountGroupSelectAll,
  AccountGroupType,
} from '@/db/app-db/drizzle-types';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getAccountsService } from '@/services/service-helpers';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AccountTypeToggle } from '../account-type-toggle';
import { AddAccountGroupForm } from './add-account-group-form';
import { useAccountDrawerContext } from '../../account-drawer-context';

export const accountFormSchema = z.object({
  accountId: z.string().nullable(),
  accountGroupId: z.coerce.string().min(1),
  accountName: z
    .string()
    .min(1, {
      message: 'Name must be at least 1 character.',
    })
    .max(255, { message: 'Name must be less than 255 characters.' }),
  accountType: z.enum(accounts.type.enumValues),
  currencyCode: z.string().min(3).max(3),
  countryCode: z.string().min(3).max(3),
  icon: z.string().nullish(),
});

export type AccountFormSchema = z.infer<typeof accountFormSchema>;

function mapAccountGroupsToComboboxItems(
  _accountGroups: AccountGroupSelectAll[],
  groupType: AccountGroupType,
): ComboboxItem<AccountGroupSelect>[] {
  return _accountGroups
    .filter((group) => group.type === groupType)
    .map((group) => ({
      label: group.name,
      value: group.id,
      data: group,
    }));
}

export const AccountForm = () => {
  const {
    accountGroups,
    setAccountGroups,
    currencies,
    currenciesInUse,
    countries,
    countriesInUse,
    defaultCountry,
    defaultCurrency,
  } = useGlobalContext();

  const { setOpen, mode, selectedTab, formValues, isProcessing, setIsProcessing } =
    useAccountDrawerContext();

  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [openGroup, setOpenGroup] = useState<boolean>(false);
  const accountGroupComboItems = useMemo(
    () => mapAccountGroupsToComboboxItems(accountGroups, selectedTab),
    [accountGroups, selectedTab],
  );

  const CANCEL_BUTTON_LABEL = 'Cancel';

  const form = useForm<AccountFormSchema>({
    resolver: zodResolver(accountFormSchema),
    defaultValues:
      mode === 'add'
        ? {
            accountId: '',
            accountName: '',
            accountType: selectedTab === 'asset' ? 'debit' : 'credit',
            currencyCode: defaultCurrency?.code ?? 'USD',
            countryCode: defaultCountry.code ?? 'USA',
            accountGroupId: formValues?.accountGroupId ?? '',
            icon: formValues?.icon ?? '💸',
          }
        : {
            accountId: formValues?.accountId,
            accountName: formValues?.accountName,
            accountType: formValues?.accountType,
            currencyCode: formValues?.currencyCode,
            countryCode: formValues?.countryCode,
            accountGroupId: formValues?.accountGroupId,
            icon: formValues?.icon,
          },
  });

  const countryCodeWatch = useWatch({ control: form.control, name: 'countryCode' });
  useEffect(() => {
    const country = countries.find((country) => country.code === countryCodeWatch);
    const defaultCurrency = currencies.find(
      (currency) => currency.id === country?.defaultCurrencyId,
    );
    form.setValue('currencyCode', defaultCurrency?.code ?? 'USD');
  }, [countryCodeWatch, countries, currencies, form]);

  async function onSubmit(form: AccountFormSchema) {
    setIsProcessing(true);
    try {
      const accountsService = await getAccountsService();
      const result =
        mode === 'add'
          ? await accountsService.insertAccount(form, selectedTab)
          : await accountsService.updateAccount(form);

      const refreshedAccountGroups = await accountsService.getAllAccountGroups();
      setAccountGroups(refreshedAccountGroups);

      const query = QUERIES.accounts.accountGroupsByCountry(selectedTab, true);
      const newData = await accountsService.getAcountsByCountry(selectedTab, true);
      queryClient.setQueryData(query.queryKey, newData);
    } catch (err) {
      console.error(err);
    } finally {
      setOpen(false);
    }
  }

  const namePlaceholder = useMemo(() => {
    switch (selectedTab) {
      case 'asset':
        return 'e.g., Cash, Bank Account, Accounts Receivable';
      case 'liability':
        return 'e.g., Credit Card, Loan Payable, Mortgage';
      case 'income':
        return 'e.g., Salary, Freelance Work, Interest Income';
      case 'expense':
        return 'e.g., Rent, Groceries, Utilities';
      case 'uncategorized':
        return '';
    }
  }, [selectedTab]);

  const SaveButton = ({ ...props }: ComponentProps<typeof Button>) => (
    <Button
      type="submit"
      variant="default"
      className={props.className}
      disabled={!form.formState.isDirty || isProcessing}
    >
      {isProcessing ? <LoaderCircle className={cn('h-4 w-4 animate-spin')} /> : <span>Save</span>}
    </Button>
  );

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
        <FormField
          control={form.control}
          name="accountGroupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group</FormLabel>
              <FormControl>
                <div className="flex flex-row items-end gap-2">
                  <div className="grow">
                    <Combobox items={accountGroupComboItems} field={field} />
                  </div>
                  <Popover open={openGroup} onOpenChange={setOpenGroup}>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Plus weight="bold" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <AddAccountGroupForm
                        groupType={selectedTab}
                        submitPostHook={() => {
                          setOpenGroup(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row gap-2">
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem className="grow">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input type="text" id="name" placeholder={namePlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="place-self-center justify-self-center">Icon</FormLabel>
                <FormControl>
                  <EmojiPicker field={field} />
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
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <CountryCombobox
                  mode="all"
                  countries={countries}
                  countriesInUse={countriesInUse}
                  field={field}
                />
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
                <CurrencyCombobox
                  currencies={currencies}
                  currenciesInUse={currenciesInUse}
                  field={field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isMobile ? (
          <SheetFooter className="px-0">
            <SaveButton />
            <SheetClose asChild>
              <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
            </SheetClose>
          </SheetFooter>
        ) : (
          <DialogFooter className="mt-4">
            <SaveButton className="w-20" />
            <DialogClose asChild>
              <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
            </DialogClose>
          </DialogFooter>
        )}
      </form>
    </Form>
  );
};

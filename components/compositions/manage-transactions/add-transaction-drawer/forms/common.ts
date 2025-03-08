import type { GroupAccountsByCountry } from '@/services/accounts-service';
import type { ComboboxItem } from '@/components/primitives/combobox';
import type { AccountSelect, JournalEntrySelect } from '@/db/drizzle/types';
import type { ReactNode } from 'react';
import type { FieldValue, FieldValues, UseFormReturn } from 'react-hook-form';

export interface TxFormProps {
  footer: ReactNode;
  onSuccess: (entry: JournalEntrySelect<{ currency: true; transactions: true }>[]) => Promise<void>;
}

export type Form = UseFormReturn<FieldValue<FieldValues>>;

type _AccountSelect = AccountSelect<{ country: true; currency: true }>;

export const mapAccounts = (
  groupAccountsByCountry: GroupAccountsByCountry,
  countryCode?: string,
): ComboboxItem<_AccountSelect>[] => {
  const mapItems = (item: GroupAccountsByCountry[string][number]) => ({
    label: item.name,
    value: item.name,
    children: item.accounts.map((account) => ({
      label: account.name,
      value: account.id.toString(),
      data: account,
    })),
  });

  if (!countryCode) {
    return Object.entries(groupAccountsByCountry).reduce((acc, cur) => {
      const [countryCode, groups] = cur;
      const obj = {
        label: countryCode,
        value: countryCode,
        children: groups.map(mapItems),
      };
      acc.push(obj);
      return acc;
    }, [] as ComboboxItem<_AccountSelect>[]);
  }

  const groups = groupAccountsByCountry[countryCode];
  if (!groups) return [];

  return groups.map(mapItems);
};

export type AccountComboItem = ReturnType<typeof mapAccounts>[number];

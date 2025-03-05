import type { GroupAccountsByCountry } from '@/app/services/accounts-service';
import type { ComboboxItem } from '@/components/primitives/combobox';
import type {
  AccountSelectWithRelations,
  JournalEntrySelectWithRelations,
} from '@/db/drizzle/types';
import type { ReactNode } from 'react';

export interface TxFormProps {
  footer: ReactNode;
  onSuccess: (entry: JournalEntrySelectWithRelations[]) => Promise<void>;
}

export const mapAccounts = (
  groupAccountsByCountry: GroupAccountsByCountry,
  countryCode: string,
): ComboboxItem<AccountSelectWithRelations>[] => {
  const groups = groupAccountsByCountry[countryCode];
  if (!groups) {
    return [];
  }

  return groups.map((group) => ({
    label: group.name,
    value: group.name,
    children: group.accounts.map((account) => ({
      label: account.name,
      value: account.id.toString(),
      data: account,
    })),
  }));
};

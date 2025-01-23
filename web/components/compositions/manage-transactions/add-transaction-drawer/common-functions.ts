import type { GroupAccountsByCountry } from '@/app/services/accounts-service';
import type { ComboboxItem } from '@/components/primitives/combobox';
import type { AccountSelectWithRelations } from '@/db/drizzle/types';

export const mapAccounts = (
  groupAccountsByCountry: GroupAccountsByCountry,
  countryCode: string,
): ComboboxItem<AccountSelectWithRelations>[] => {
  return groupAccountsByCountry[countryCode].map((group) => ({
    label: group.name,
    value: group.name,
    children: group.accounts.map((account) => ({
      label: account.name,
      value: account.id.toString(),
      data: account,
    })),
  }));
};

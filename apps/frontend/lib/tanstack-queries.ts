import type { AccountGroupType, CurrencySelect, JournalEntryType } from '@/db/drizzle/types';
import {
  getAccountsService,
  getConfigService,
  getTransactionService,
} from '@/services/service-helpers';
import { queryOptions } from '@tanstack/react-query';
import { authClient } from '@/lib/better-auth/auth-client';

export const QUERIES = {
  config: {
    countries: () =>
      queryOptions({
        queryKey: ['countries'],
        queryFn: async () => (await getConfigService()).getAllCountries(),
      }),
    currencies: () =>
      queryOptions({
        queryKey: ['currencies'],
        queryFn: async () => (await getConfigService()).getAllCurrencies(),
      }),
    defaultCountry: () =>
      queryOptions({
        queryKey: ['defaultCountry'],
        queryFn: async () => (await getConfigService()).getDefaultCountry(),
      }),
    defaultCurrency: () =>
      queryOptions({
        queryKey: ['defaultCurrency'],
        queryFn: async () => (await getConfigService()).getDefaultCurrency(),
      }),
    latestFxRate: (baseCurrencies: CurrencySelect[], targetCurrencies: CurrencySelect[]) =>
      queryOptions({
        queryKey: ['getLatestFxRate'],
        queryFn: async () =>
          (await getConfigService()).getLatestFxRate(baseCurrencies, targetCurrencies),
      }),
  },
  accounts: {
    accountGroupsByCountry: (groupType: AccountGroupType, includeArchived: boolean) =>
      queryOptions({
        queryKey: ['getAccountsByCountry', groupType],
        queryFn: async () =>
          (await getAccountsService()).getAcountsByCountry(groupType, includeArchived),
      }),
    allAccounts: () =>
      queryOptions({
        queryKey: ['getAllAccounts'],
        queryFn: async () => (await getAccountsService()).getAllAccounts(),
      }),
    allAccountGroups: () =>
      queryOptions({
        queryKey: ['getAllAccountGroups'],
        queryFn: async () => (await getAccountsService()).getAllAccountGroups(),
      }),
  },
  transaction: {
    summary: (from: Date, to: Date, baseCurrency: CurrencySelect) =>
      queryOptions({
        queryKey: ['getSummary', { from, to, baseCurrency }],
        queryFn: async () => (await getTransactionService()).getSummary(from, to, baseCurrency),
      }),
    journalEntries: (
      entryTypes: JournalEntryType[],
      dateRange: { from?: Date; to?: Date },
      includeTx: boolean = false,
    ) =>
      queryOptions({
        queryKey: [
          'getJournalEntries',
          { entryType: entryTypes, from: dateRange.from, to: dateRange.to },
        ],
        queryFn: async () => {
          return (await getTransactionService()).getJournalEntries(
            entryTypes,
            dateRange,
            includeTx,
          );
        },
        enabled: !!dateRange.from && !!dateRange.to,
      }),
  },
  sync: {
    listPasskeys: () =>
      queryOptions({
        queryKey: ['passkeys'],
        queryFn: async () => await authClient.passkey.listUserPasskeys(),
      }),
    refreshUsername: (userEmail: string | undefined) =>
      queryOptions({
        queryKey: ['refreshUsername'],
        queryFn: async () => {
          if (!userEmail) return;
          const configService = await getConfigService();
          const currentUsername = (await configService.getUserConfig('username'))?.value;
          if (currentUsername !== userEmail) {
            await configService.upsertUserConfig('username', userEmail);
          }
          return userEmail;
        },
      }),
  },
};

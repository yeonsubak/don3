import type { AccountGroupType, CurrencySelect, JournalEntryType } from '@/db/drizzle/types';
import { getConfigService } from '@/services/config-service';
import { getAccountsService, getTransactionService } from '@/services/helper';
import { queryOptions } from '@tanstack/react-query';

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
    defaultCurrency: () =>
      queryOptions({
        queryKey: ['defaultCurrency'],
        queryFn: async () => (await getConfigService()).getDefaultCurrency(),
      }),
    latestFxRate: (baseCurrency: CurrencySelect, targetCurrencies: CurrencySelect[]) =>
      queryOptions({
        queryKey: ['getLatestFxRate'],
        queryFn: async () =>
          (await getConfigService()).getLatestFxRate(baseCurrency, targetCurrencies),
      }),
  },
  accounts: {
    accountGroupsByCountry: (groupType: AccountGroupType) =>
      queryOptions({
        queryKey: ['getAccountsByCountry', groupType],
        queryFn: async () => (await getAccountsService()).getAcountsByCountry(groupType),
      }),
    allAccounts: () =>
      queryOptions({
        queryKey: ['getAllAccounts'],
        queryFn: async () => (await getAccountsService()).getAllAccounts(),
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
};

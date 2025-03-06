'use client';

import { AccountsService } from '@/app/services/accounts-service';
import { ConfigService } from '@/app/services/config-service';
import { TransactionService } from '@/app/services/transaction-service';
import type { AccountGroupType, CurrencySelect, JournalEntryTypeArray } from '@/db/drizzle/types';
import { queryOptions } from '@tanstack/react-query';

const getConfigService = async () => await ConfigService.getInstance<ConfigService>();
const getAccountsService = async () => await AccountsService.getInstance<AccountsService>();
const getTransactionService = async () =>
  await TransactionService.getInstance<TransactionService>();

export const QUERIES = {
  config: {
    countries: queryOptions({
      queryKey: ['countries'],
      queryFn: async () => await (await getConfigService()).getAllCountries(),
    }),
    countriesInUse: queryOptions({
      queryKey: ['countriesInUse'],
      queryFn: async () => await (await getConfigService()).getCountriesInUse(),
    }),
    currenciesInUse: queryOptions({
      queryKey: ['currenciesInUse'],
      queryFn: async () => await (await getConfigService()).getCurrenciesInUse(),
    }),
    currencies: queryOptions({
      queryKey: ['currencies'],
      queryFn: async () => await (await getConfigService()).getAllCurrencies(),
    }),
    defaultCurrency: queryOptions({
      queryKey: ['defaultCurrency'],
      queryFn: async () => await (await getConfigService()).getDefaultCurrency(),
    }),
    getLatestFxRate: (baseCurrency: CurrencySelect, targetCurrencies: CurrencySelect[]) =>
      queryOptions({
        queryKey: ['getLatestFxRate'],
        queryFn: async () =>
          await (await getConfigService()).getLatestFxRate(baseCurrency, targetCurrencies),
      }),
  },
  accounts: {
    getAccountGroupsByCountry: (groupType: AccountGroupType) =>
      queryOptions({
        queryKey: ['getAccountsByCountry', groupType],
        queryFn: async () => await (await getAccountsService()).getAcountsByCountry(groupType),
      }),
    getAllAccounts: queryOptions({
      queryKey: ['getAllAccounts'],
      queryFn: async () => await (await getAccountsService()).getAllAccounts(),
    }),
  },
  transaction: {
    getSummary: (from: Date, to: Date, baseCurrency: CurrencySelect) =>
      queryOptions({
        queryKey: ['getSummary', { from, to, baseCurrency }],
        queryFn: async () =>
          await (await getTransactionService()).getSummary(from, to, baseCurrency),
      }),
    getJournalEntries: (
      entryType: JournalEntryTypeArray,
      { from, to }: { from?: Date; to?: Date },
      includeTx: boolean = false,
    ) =>
      queryOptions({
        queryKey: ['getJournalEntries', { entryType, from, to }],
        queryFn: async () =>
          await (
            await getTransactionService()
          ).getJournalEntries(entryType, { from, to }, includeTx),
        enabled: !!from && !!to,
      }),
  },
};

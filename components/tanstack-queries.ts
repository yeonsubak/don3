'use client';

import { AccountsService } from '@/app/services/accounts-service';
import { ConfigService } from '@/app/services/config-service';
import { TransactionService } from '@/app/services/transaction-service';
import { DBInitializer } from '@/db/db-initializer';
import type { CurrencySelect } from '@/db/drizzle/types';
import { queryOptions, skipToken } from '@tanstack/react-query';

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
  },
  accounts: {
    assetGroupsByCountry: queryOptions({
      queryKey: ['assetGroupsByCountry'],
      queryFn: async () => await (await getAccountsService()).getAcountsByCountry('asset'),
    }),
    expenseGroupsByCountry: queryOptions({
      queryKey: ['expenseGroupsByCountry'],
      queryFn: async () => await (await getAccountsService()).getAcountsByCountry('expense'),
    }),
  },
  transaction: {
    getIncomeSummary: (from: Date, to: Date, baseCurrency: CurrencySelect) =>
      queryOptions({
        queryKey: ['getIncomeSummary', { from, to, baseCurrency }],
        queryFn: async () =>
          await (await getTransactionService()).getIncomeSummary(from, to, baseCurrency),
      }),
    getExpenseSummary: (from: Date, to: Date, baseCurrency: CurrencySelect) =>
      queryOptions({
        queryKey: ['getExpenseSummary', { from, to, baseCurrency }],
        queryFn: async () =>
          await (await getTransactionService()).getExpenseSummary(from, to, baseCurrency),
      }),
  },
};

'use client';

import { AccountsService } from '@/app/services/accounts-service';
import { ConfigService } from '@/app/services/config-service';
import { TransactionService } from '@/app/services/transaction-service';
import { PGliteDrizzleWorker } from '@/db/pglite-web-worker';
import { queryOptions } from '@tanstack/react-query';

const getConfigService = async () => new ConfigService(await PGliteDrizzleWorker.create());
const getAccountsService = async () => new AccountsService(await PGliteDrizzleWorker.create());
const getTransactionService = async () =>
  new TransactionService(await PGliteDrizzleWorker.create());

export const QUERIES = {
  config: {
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
    getIncomeSummary: (from: Date, to: Date) =>
      queryOptions({
        queryKey: ['getIncomeSummary', { from, to }],
        queryFn: async () => await (await getTransactionService()).getIncomeSummary(from, to),
      }),
    getExpenseSummary: (from: Date, to: Date) =>
      queryOptions({
        queryKey: ['getExpenseSummary', { from, to }],
        queryFn: async () => await (await getTransactionService()).getExpenseSummary(from, to),
      }),
  },
};

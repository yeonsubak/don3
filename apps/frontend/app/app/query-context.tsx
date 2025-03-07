import type { AccountGroupType, CurrencySelect, JournalEntryType } from '@/db/drizzle/types';
import { queryOptions, useQueries, useQuery } from '@tanstack/react-query';
import { createContext, useContext, type ReactNode } from 'react';
import type { AccountsService } from '../services/accounts-service';
import type { ConfigService } from '../services/config-service';
import type { TransactionService } from '../services/transaction-service';
import { serviceContextQueries } from './service-context';

type QueryContext = {
  QUERIES: Awaited<ReturnType<typeof createQueries>>;
};

export const QueryContext = createContext<QueryContext | null>(null);

export const QueryContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: { accountsService, configService, transactionService },
  } = useQueries({
    queries: [serviceContextQueries[0], serviceContextQueries[1], serviceContextQueries[2]],
    combine: (results) => ({
      data: {
        configService: results[0].data as ConfigService,
        accountsService: results[1].data as AccountsService,
        transactionService: results[2].data as TransactionService,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const {
    data: queries,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['createQueries'],
    queryFn: () => createQueries(accountsService, configService, transactionService),
    enabled: !!accountsService && !!configService && !!transactionService,
  });

  if (isPending) return <></>;

  if (isError) return <p>Error: ${error?.message}</p>;

  return <QueryContext.Provider value={{ QUERIES: queries }}>{children}</QueryContext.Provider>;
};

export const useQueryContext = () => {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQueryContext must be used within a QueryContextProvider');
  }
  return context;
};

const createQueries = (
  accountsService: AccountsService,
  configService: ConfigService,
  transactionService: TransactionService,
) => {
  return {
    config: {
      countries: queryOptions({
        queryKey: ['countries'],
        queryFn: async () => configService?.getAllCountries(),
      }),
      currencies: queryOptions({
        queryKey: ['currencies'],
        queryFn: async () => configService?.getAllCurrencies(),
      }),
      defaultCurrency: queryOptions({
        queryKey: ['defaultCurrency'],
        queryFn: async () => configService?.getDefaultCurrency(),
      }),
      getLatestFxRate: (baseCurrency: CurrencySelect, targetCurrencies: CurrencySelect[]) =>
        queryOptions({
          queryKey: ['getLatestFxRate'],
          queryFn: async () => configService?.getLatestFxRate(baseCurrency, targetCurrencies),
        }),
    },
    accounts: {
      getAccountGroupsByCountry: (groupType: AccountGroupType) =>
        queryOptions({
          queryKey: ['getAccountsByCountry', groupType],
          queryFn: async () => accountsService?.getAcountsByCountry(groupType),
        }),
      getAllAccounts: queryOptions({
        queryKey: ['getAllAccounts'],
        queryFn: async () => accountsService?.getAllAccounts(),
      }),
    },
    transaction: {
      getSummary: (from: Date, to: Date, baseCurrency: CurrencySelect) =>
        queryOptions({
          queryKey: ['getSummary', { from, to, baseCurrency }],
          queryFn: async () => transactionService?.getSummary(from, to, baseCurrency),
        }),
      getJournalEntries: (
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
            return transactionService?.getJournalEntries(entryTypes, dateRange, includeTx);
          },
          enabled: !!dateRange.from && !!dateRange.to,
        }),
    },
  };
};

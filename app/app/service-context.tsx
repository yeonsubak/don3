import { queryOptions, useQueries } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { AccountsRepository } from '../repositories/accounts-repository';
import { ConfigRepository } from '../repositories/config-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { AccountsService } from '../services/accounts-service';
import { ConfigService } from '../services/config-service';
import { TransactionService } from '../services/transaction-service';

type ServiceContext = {
  accountsService?: AccountsService;
  configService?: ConfigService;
  transactionService?: TransactionService;
};

export const ServiceContext = createContext<ServiceContext | null>(null);

export const serviceContextQueries = [
  queryOptions({
    queryKey: ['getConfigService'],
    queryFn: async () => {
      const configRepository = await ConfigRepository.getInstance<ConfigRepository>();
      return new ConfigService(configRepository);
    },
  }),
  queryOptions({
    queryKey: ['getAccountsService'],
    queryFn: async () => {
      const accountsRepository = await AccountsRepository.getInstance<AccountsRepository>();
      const configRepository = await ConfigRepository.getInstance<ConfigRepository>();
      return new AccountsService(accountsRepository, configRepository);
    },
  }),
  queryOptions({
    queryKey: ['getTransactionService'],
    queryFn: async () => {
      const transactionRepository =
        await TransactionRepository.getInstance<TransactionRepository>();
      const accountsRepository = await AccountsRepository.getInstance<AccountsRepository>();
      const configRepository = await ConfigRepository.getInstance<ConfigRepository>();
      const configService = new ConfigService(configRepository);
      return new TransactionService(transactionRepository, accountsRepository, configService);
    },
  }),
];

export const ServiceContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: { _accountsService, _configService, _transactionService },
    isPending,
    isError,
    error,
  } = useQueries({
    queries: [serviceContextQueries[0], serviceContextQueries[1], serviceContextQueries[2]],
    combine: (results) => ({
      data: {
        _configService: results[0].data as ConfigService,
        _accountsService: results[1].data as AccountsService,
        _transactionService: results[2].data as TransactionService,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const configService = useMemo(() => _configService, [_configService]);
  const accountsService = useMemo(() => _accountsService, [_accountsService]);
  const transactionService = useMemo(() => _transactionService, [_transactionService]);

  if (isPending) return <></>;

  if (isError) return error.map((e, i) => <p key={i}>Error: ${e?.message}</p>);

  return (
    <ServiceContext.Provider
      value={{
        configService,
        accountsService,
        transactionService,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useServiceContext = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServiceContext must be used within a ServiceContextProvider');
  }
  return context;
};

import { AccountsRepository } from './accounts-repository';
import { ConfigRepository } from './config-repository';
import { TransactionRepository } from './transaction-repository';

export const getAccountsRepository = async () => {
  return AccountsRepository.getInstance<AccountsRepository>();
};

export const getConfigRepository = async () => {
  return ConfigRepository.getInstance<ConfigRepository>();
};

export const getTransactionRepository = async () => {
  return TransactionRepository.getInstance<TransactionRepository>();
};

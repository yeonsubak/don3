import {
  getAccountsRepository,
  getConfigRepository,
  getTransactionRepository,
} from '../repositories/helper';
import { AccountsService } from './accounts-service';
import { ConfigService } from './config-service';
import { TransactionService } from './transaction-service';

export const getAccountsService = async () => {
  const accountsRepository = await getAccountsRepository();
  const configRepository = await getConfigRepository();
  const TransactionRepository = await getTransactionRepository();
  return new AccountsService(accountsRepository, configRepository, TransactionRepository);
};

export const getConfigService = async () => {
  const configRepository = await getConfigRepository();
  return new ConfigService(configRepository);
};

export const getTransactionService = async () => {
  const TransactionRepository = await getTransactionRepository();
  const accountsRepository = await getAccountsRepository();
  const configService = await getConfigService();
  return new TransactionService(TransactionRepository, accountsRepository, configService);
};

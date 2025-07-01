/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { AppSchema } from '@/db/app-db/drizzle-types';
import type { Repository } from './abstract-repository';

import {
  getAccountsRepository,
  getConfigRepository,
  getTransactionRepository,
} from './repository-helpers';

function findMethod(methodName: string) {
  const split = methodName.split('.');
  if (split.length !== 2) {
    throw new Error("Method name must contain two words delimited by '.'.");
  }

  return {
    className: split[0],
    methodName: split[1],
  };
}

export function returnObj(repository: Repository<AppSchema>, method: Function) {
  return {
    method,
    repository,
  };
}

export async function getMethod(
  _methodName: string,
): Promise<{ method: Function; repository: Repository<AppSchema> }> {
  const { className, methodName } = findMethod(_methodName);

  if (className === 'AccountsRepository') {
    const repo = await getAccountsRepository();
    switch (methodName) {
      case 'insertAccount': {
        return returnObj(repo, repo.insertAccount);
      }
      case 'updateAccount': {
        return returnObj(repo, repo.updateAccount);
      }
      case 'deleteAccount': {
        return returnObj(repo, repo.deleteAccount);
      }
      case 'insertAccountGroup': {
        return returnObj(repo, repo.insertAccountGroup);
      }
      case 'insertAccountBalance': {
        return returnObj(repo, repo.insertAccountBalance);
      }
      case 'updateAccountBalance': {
        return returnObj(repo, repo.updateAccountBalance);
      }
    }
  }

  if (className === 'ConfigRepository') {
    const repo = await getConfigRepository();
    switch (methodName) {
      case 'insertUserConfig': {
        return returnObj(repo, repo.insertUserConfig);
      }
      case 'updateUserConfig': {
        return returnObj(repo, repo.updateUserConfig);
      }
    }
  }

  if (className === 'TransactionRepository') {
    const repo = await getTransactionRepository();
    switch (methodName) {
      case 'insertJournalEntry': {
        return returnObj(repo, repo.insertJournalEntry);
      }
      case 'updateJournalEntry': {
        return returnObj(repo, repo.updateJournalEntry);
      }
      case 'deleteJournalEntries': {
        return returnObj(repo, repo.deleteJournalEntries);
      }
      case 'insertJournalEntryFxRate': {
        return returnObj(repo, repo.insertJournalEntryFxRate);
      }
      case 'updateJournalEntryFxRate': {
        return returnObj(repo, repo.updateJournalEntryFxRate);
      }
      case 'insertTransaction': {
        return returnObj(repo, repo.insertTransaction);
      }
      case 'updateTransaction': {
        return returnObj(repo, repo.updateTransaction);
      }
    }
  }

  throw new Error('Matching method not found.');
}

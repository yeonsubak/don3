import { createInMemoryPGLiteDrizzle } from '@/__tests__/common';
import type { AccountBalanceInsert, AccountBalanceSelect, AccountInsert } from '@/db/drizzle/types';
import { AccountsRepository } from '@/repositories/accounts-repository';
import { beforeEach, describe, expect, test } from 'vitest';

describe('AccountsRepository', { timeout: 2000 }, () => {
  let repo: AccountsRepository;
  const ACCOUNT_GROUP_ID_1 = 'a3a1eeb2-4095-40c2-b46e-c89c71bf92ee';
  const ACCOUNT_GROUP_ID_2 = '41687ca0-44a5-4da4-92ac-46c9c8f504b1';
  const CURRENCY_ID = '0449fd3c-e5bb-4124-8784-169ddbfc072b';
  const COUNTRY_ID = 'ac2c2eb6-29d1-4858-a552-026d51d72f94';
  const ACCOUNT_ICON = 'piggy-bank';

  const ACCOUNT_1: AccountInsert = {
    id: crypto.randomUUID(),
    accountGroupId: ACCOUNT_GROUP_ID_1,
    name: 'InsertTest',
    type: 'debit',
    currencyId: CURRENCY_ID,
    countryId: COUNTRY_ID,
    icon: ACCOUNT_ICON,
  };

  const ACCOUNT_2: AccountInsert = {
    id: crypto.randomUUID(),
    accountGroupId: ACCOUNT_GROUP_ID_2,
    name: 'InsertTest2',
    type: 'debit',
    currencyId: CURRENCY_ID,
    countryId: COUNTRY_ID,
    icon: ACCOUNT_ICON,
  };

  const INITIAL_ACCOUNT_BALANCE: AccountBalanceInsert = {
    accountId: ACCOUNT_1.id!,
    balance: 0,
  };

  beforeEach(async () => {
    const pg = await createInMemoryPGLiteDrizzle();
    repo = new AccountsRepository(pg);
  });

  describe('insertAccount', () => {
    test('should insert a new account and return the expected fields', async () => {
      const insertResult = await repo.insertAccount(ACCOUNT_1);

      expect(insertResult).toMatchObject({
        ...ACCOUNT_1,
      });
    });

    test('should insert a new account and be retrievable by getAccountById', async () => {
      const insertResult = await repo.insertAccount(ACCOUNT_1);
      const accountGetById = await repo.getAccountById(insertResult!.id);

      expect(accountGetById).toMatchObject(ACCOUNT_1);
    });
  });

  describe('getAllAccounts', () => {
    test('should insert new accounts and return all of them', async () => {
      await Promise.all([repo.insertAccount(ACCOUNT_1), repo.insertAccount(ACCOUNT_2)]);
      const allAccounts = await repo.getAllAccounts();

      expect(allAccounts.length).toBe(2);
    });

    test('should return an empty array if no accounts exist', async () => {
      const allAccounts = await repo.getAllAccounts();
      expect(allAccounts).toEqual([]);
    });
  });

  describe('insertAccountBalance', () => {
    test('should insert a new account balance and return the expected fields', async () => {
      await repo.insertAccount(ACCOUNT_1);
      const insertedBalance = await repo.insertAccountBalance(INITIAL_ACCOUNT_BALANCE);

      expect(insertedBalance).toMatchObject(INITIAL_ACCOUNT_BALANCE);
    });
  });

  describe('updateAccountBalance', () => {
    let insertedBalance: AccountBalanceSelect | undefined;

    beforeEach(async () => {
      const insertedAccount = await repo.insertAccount(ACCOUNT_1);
      insertedBalance = await repo.insertAccountBalance(INITIAL_ACCOUNT_BALANCE);
    });

    test('should update the balance of an account balance with an integer value', async () => {
      const updatedBalance = await repo.updateAccountBalance(insertedBalance!.id, 16521);
      expect(updatedBalance).toMatchObject({
        id: insertedBalance!.id,
        balance: 16521,
      });
    });

    test('should update the balance of an account balance with a decimal value (scale - 1)', async () => {
      const updatedBalance = await repo.updateAccountBalance(insertedBalance!.id, 985.68);
      expect(updatedBalance).toMatchObject({
        id: insertedBalance!.id,
        balance: 985.68,
      });
    });

    test('should update the balance of an account balance with a decimal value (scale - 2)', async () => {
      const updatedBalance = await repo.updateAccountBalance(insertedBalance!.id, 16825.455555);
      expect(updatedBalance).toMatchObject({
        id: insertedBalance!.id,
        balance: 16825.46,
      });
    });

    test('should return undefined if the account balance to update does not exist', async () => {
      const nonExistentAccountBalanceId = crypto.randomUUID();
      const updatedBalance = await repo.updateAccountBalance(nonExistentAccountBalanceId, 100);
      expect(updatedBalance).toBeUndefined();
    });
  });
});

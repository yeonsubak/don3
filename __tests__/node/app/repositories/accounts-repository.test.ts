import { createInMemoryPGLiteDrizzle } from '@/__tests__/common';
import type { PgliteDrizzle } from '@/db';
import { accounts } from '@/db/drizzle/schema';
import type { AccountBalanceInsert, AccountBalanceSelect, AccountInsert } from '@/db/drizzle/types';
import { AccountsRepository } from '@/repositories/accounts-repository';
import { TransactionRepository } from '@/repositories/transaction-repository';
import { beforeEach, describe, expect, test } from 'vitest';

describe('AccountsRepository', { timeout: 2000 }, () => {
  let accountsRepo: AccountsRepository;
  let pg: PgliteDrizzle;

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

  const ACCOUNT_1_BALANCE: AccountBalanceInsert = {
    accountId: ACCOUNT_1.id!,
    balance: 0,
  };

  beforeEach(async () => {
    pg = await createInMemoryPGLiteDrizzle();
    accountsRepo = new AccountsRepository(pg);
  });

  describe('insertAccount', () => {
    test('should insert a new account and return the expected fields', async () => {
      const insertResult = await accountsRepo.insertAccount(ACCOUNT_1);

      expect(insertResult).toMatchObject({
        ...ACCOUNT_1,
      });
    });

    test('should insert a new account and be retrievable by getAccountById', async () => {
      const insertResult = await accountsRepo.insertAccount(ACCOUNT_1);
      const accountGetById = await accountsRepo.getAccountById(insertResult!.id);

      expect(accountGetById).toMatchObject(ACCOUNT_1);
    });
  });

  describe('getAllAccounts', () => {
    test('should insert new accounts and return all of them', async () => {
      await Promise.all([
        accountsRepo.insertAccount(ACCOUNT_1),
        accountsRepo.insertAccount(ACCOUNT_2),
      ]);
      const allAccounts = await accountsRepo.getAllAccounts();

      expect(allAccounts.length).toBe(2);
    });

    test('should return an empty array if no accounts exist', async () => {
      const allAccounts = await accountsRepo.getAllAccounts();
      expect(allAccounts).toEqual([]);
    });
  });

  describe('insertAccountBalance', () => {
    test('should insert a new account balance and return the expected fields', async () => {
      await accountsRepo.insertAccount(ACCOUNT_1);
      const insertedBalance = await accountsRepo.insertAccountBalance(ACCOUNT_1_BALANCE);

      expect(insertedBalance).toMatchObject(ACCOUNT_1_BALANCE);
    });
  });

  describe('updateAccountBalance', () => {
    let insertedBalance: AccountBalanceSelect | undefined;

    beforeEach(async () => {
      const insertedAccount = await accountsRepo.insertAccount(ACCOUNT_1);
      insertedBalance = await accountsRepo.insertAccountBalance(ACCOUNT_1_BALANCE);
    });

    test('should update the balance of an account balance with an integer value', async () => {
      const updatedBalance = await accountsRepo.updateAccountBalance(insertedBalance!.id, 16521);
      expect(updatedBalance).toMatchObject({
        id: insertedBalance!.id,
        balance: 16521,
      });
    });

    test('should update the balance of an account balance with a decimal value (scale - 1)', async () => {
      const updatedBalance = await accountsRepo.updateAccountBalance(insertedBalance!.id, 985.68);
      expect(updatedBalance).toMatchObject({
        id: insertedBalance!.id,
        balance: 985.68,
      });
    });

    test('should update the balance of an account balance with a decimal value (scale - 2)', async () => {
      const updatedBalance = await accountsRepo.updateAccountBalance(
        insertedBalance!.id,
        16825.455555,
      );
      expect(updatedBalance).toMatchObject({
        id: insertedBalance!.id,
        balance: 16825.46,
      });
    });

    test('should return undefined if the account balance to update does not exist', async () => {
      const nonExistentAccountBalanceId = crypto.randomUUID();
      const updatedBalance = await accountsRepo.updateAccountBalance(
        nonExistentAccountBalanceId,
        100,
      );
      expect(updatedBalance).toBeUndefined();
    });
  });

  describe('deleteAccount', () => {
    test('should delete the account', async () => {
      const account = await accountsRepo.insertAccount(ACCOUNT_1);
      await accountsRepo.deleteAccount(account!.id);
      const accountAfterDelete = await accountsRepo.getAccountById(account!.id);
      expect(accountAfterDelete).toBeUndefined();
    });
    test('should delete the account and related records', async () => {
      const transactionRepo = new TransactionRepository(pg);

      const account1 = await accountsRepo.insertAccount(ACCOUNT_1);
      const account2 = await accountsRepo.insertAccount(ACCOUNT_2);
      const balance1 = await accountsRepo.insertAccountBalance(ACCOUNT_1_BALANCE)!;
      const journalEntry = await transactionRepo.insertJournalEntry({
        type: 'income',
        date: new Date(),
        title: 'deleteAccount',
        description: 'should delete the account and related records',
        currencyId: account1!.currencyId,
        amount: 15843,
      });
      const fxRate = await transactionRepo.insertJournalEntryFxRate({
        journalEntryId: journalEntry!.id,
        baseCurrencyId: account1!.currencyId,
        targetCurrencyId: 'f33a4c09-de77-4ebb-add2-4ceb7312439a',
        rate: 1000,
      });
      const debitTx = await transactionRepo.insertTransaction({
        type: 'debit',
        accountId: account1!.id,
        journalEntryId: journalEntry!.id,
        amount: 15843,
      });
      const creditTx = await transactionRepo.insertTransaction({
        type: 'credit',
        accountId: account2!.id,
        journalEntryId: journalEntry!.id,
        amount: 15843,
      });

      await accountsRepo.deleteAccount(account1!.id);
      const account1AfterDelete = await accountsRepo.getAccountById(account1!.id);
      expect(account1AfterDelete).toBeUndefined();
      const balance1AfterDelete = await accountsRepo.getAccountBalance(account1!.id);
      expect(balance1AfterDelete).toBeUndefined();
      const txAfterDelete = await pg.query.transactions.findMany({
        where: ({ accountId }, { eq }) => eq(accountId, account1!.id),
      });
      expect(txAfterDelete.length).toBe(0);

      const journalEntryAfterDelete = await transactionRepo.getJournalEntryById(journalEntry!.id);
      expect(journalEntryAfterDelete).not.toBeUndefined();
      const fxRateAfterDelete = await pg.query.journalEntryFxRates.findMany({
        where: ({ journalEntryId }, { eq }) => eq(journalEntryId, journalEntry!.id),
      });
      expect(fxRateAfterDelete).not.toBe(0);
    });
  });
});

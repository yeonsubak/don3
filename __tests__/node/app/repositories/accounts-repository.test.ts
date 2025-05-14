import { createInMemoryPGLiteDrizzle } from '@/__tests__/common';
import type { AccountBalanceInsert, AccountInsert } from '@/db/drizzle/types';
import { AccountsRepository } from '@/repositories/accounts-repository';
import { beforeEach, describe, expect, test } from 'vitest';

let repo: AccountsRepository;

beforeEach(async () => {
  const pg = await createInMemoryPGLiteDrizzle();
  repo = new AccountsRepository(pg);
});

describe('AccountsRepository', () => {
  const INSERTING_ACCOUNTS: AccountInsert[] = [
    {
      id: crypto.randomUUID(),
      accountGroupId: 'a3a1eeb2-4095-40c2-b46e-c89c71bf92ee',
      name: 'InsertTest',
      type: 'debit',
      currencyId: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
      countryId: 'ac2c2eb6-29d1-4858-a552-026d51d72f94',
      icon: 'piggy-bank',
    },
    {
      id: crypto.randomUUID(),
      accountGroupId: '41687ca0-44a5-4da4-92ac-46c9c8f504b1',
      name: 'InsertTest2',
      type: 'debit',
      currencyId: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
      countryId: 'ac2c2eb6-29d1-4858-a552-026d51d72f94',
      icon: 'piggy-bank',
    },
  ];

  const INSERTING_ACCOUNT_BALANCE: AccountBalanceInsert = {
    accountId: INSERTING_ACCOUNTS[0].id!,
    balance: 0,
  };

  test('inserts a new account and returns the expected fields', async () => {
    const insertResult = await repo.insertAccount(INSERTING_ACCOUNTS[0]);

    expect(insertResult).not.toBeNull();
    expect(insertResult).not.toBeUndefined();
    expect(insertResult).toMatchObject({
      accountGroupId: 'a3a1eeb2-4095-40c2-b46e-c89c71bf92ee',
      name: 'InsertTest',
      type: 'debit',
      currencyId: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
      countryId: 'ac2c2eb6-29d1-4858-a552-026d51d72f94',
      icon: 'piggy-bank',
    });
  });

  test('inserts a new account and returns inserted account by getAccountById()', async () => {
    const insertResult = await repo.insertAccount(INSERTING_ACCOUNTS[0]);
    const accountGetById = await repo.getAccountById(insertResult!.id);

    expect(accountGetById).not.toBeNull();
    expect(accountGetById).not.toBeUndefined();
    expect(accountGetById).toMatchObject({
      accountGroupId: 'a3a1eeb2-4095-40c2-b46e-c89c71bf92ee',
      name: 'InsertTest',
      type: 'debit',
      currencyId: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
      countryId: 'ac2c2eb6-29d1-4858-a552-026d51d72f94',
      icon: 'piggy-bank',
    });
  });

  test('inserts new accounts and returns all accounts by getAllAccounts()', async () => {
    const insertResult = await Promise.all([
      await repo.insertAccount(INSERTING_ACCOUNTS[0]),
      await repo.insertAccount(INSERTING_ACCOUNTS[1]),
    ]);
    const allAccounts = await repo.getAllAccounts();

    expect(allAccounts.length).toBe(2);
  });

  test('inserts a new account balance and returns the expected fields', async () => {
    const insertedAccount = await repo.insertAccount(INSERTING_ACCOUNTS[0]);
    const insertedBalance = await repo.insertAccountBalance(INSERTING_ACCOUNT_BALANCE);

    expect(insertedBalance).not.toBeNull();
    expect(insertedBalance).not.toBeUndefined();
    expect(insertedBalance).toMatchObject({
      accountId: INSERTING_ACCOUNTS[0].id,
      balance: 0,
    });
  });

  test('Update the balance of an account balance', async () => {
    const insertedAccount = await repo.insertAccount(INSERTING_ACCOUNTS[0]);
    const insertedBalance = await repo.insertAccountBalance(INSERTING_ACCOUNT_BALANCE);
    const addedBalance = await repo.updateAccountBalance(insertedBalance!.id, 16521);

    expect(addedBalance).not.toBeNull();
    expect(addedBalance).not.toBeUndefined();
    expect(addedBalance).toMatchObject({
      accountId: INSERTING_ACCOUNTS[0].id,
      balance: 16521,
    });
  });

  test('Update the balance of an account balance with scale - 1', async () => {
    const insertedAccount = await repo.insertAccount(INSERTING_ACCOUNTS[0]);
    const insertedBalance = await repo.insertAccountBalance(INSERTING_ACCOUNT_BALANCE);
    const addedBalance = await repo.updateAccountBalance(insertedBalance!.id, 985.68);

    expect(addedBalance).not.toBeNull();
    expect(addedBalance).not.toBeUndefined();
    expect(addedBalance).toMatchObject({
      accountId: INSERTING_ACCOUNTS[0].id,
      balance: 985.68,
    });
  });

  test('Update the balance of an account balance with scale - 2', async () => {
    const insertedAccount = await repo.insertAccount(INSERTING_ACCOUNTS[0]);
    const insertedBalance = await repo.insertAccountBalance(INSERTING_ACCOUNT_BALANCE);
    const addedBalance = await repo.updateAccountBalance(insertedBalance!.id, 16825.455555);

    expect(addedBalance).not.toBeNull();
    expect(addedBalance).not.toBeUndefined();
    expect(addedBalance).toMatchObject({
      accountId: INSERTING_ACCOUNTS[0].id,
      balance: 16825.46,
    });
  });
});

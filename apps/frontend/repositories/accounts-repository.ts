import { accountBalances, accounts } from '@/db/drizzle/schema';
import type {
  AccountBalanceInsert,
  AccountBalanceSelect,
  AccountGroupType,
  AccountInsert,
  AccountSelectAll,
  PgliteTransaction,
} from '@/db/drizzle/types';
import { Repository } from './abstract-repository';
import type { PgliteDrizzle } from '@/db';

export class AccountsRepository extends Repository {
  public async getAllAccounts(): Promise<AccountSelectAll[]> {
    return await this.db.query.accounts.findMany({
      with: {
        currency: true,
        country: true,
        group: true,
        balance: true,
      },
    });
  }

  public async getAccountById(id: number): Promise<AccountSelectAll | undefined> {
    return await this.db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, id),
      with: {
        currency: true,
        country: true,
        group: true,
        balance: true,
      },
    });
  }

  public async insertAccount(insert: AccountInsert) {
    const result = await this.db.insert(accounts).values(insert).returning();
    return result.at(0);
  }

  public async getAccountGroupsByType(
    groupType: AccountGroupType,
    includeHidden: boolean = false,
    isFlatten: boolean = true,
  ) {
    return await this.db.query.accountGroups.findMany({
      where: ({ parentGroupId, type, isHidden }, { and, eq, isNull }) =>
        isFlatten
          ? and(eq(isHidden, includeHidden), eq(type, groupType), isNull(parentGroupId))
          : and(eq(isHidden, includeHidden), eq(type, groupType)),
      with: {
        childGroups: true,
        accounts: {
          with: {
            country: true,
            currency: true,
            balance: true,
          },
        },
      },
    });
  }

  public async getAccountBalance(targetAccountId: number, tx?: PgliteTransaction) {
    const db = tx ? tx : this.db;
    return await db.query.accountBalances.findFirst({
      where: ({ accountId }, { eq }) => eq(accountId, targetAccountId),
    });
  }

  public async insertAccountBalance(
    accountBalanceInsert: AccountBalanceInsert,
    tx?: PgliteTransaction,
  ): Promise<AccountBalanceSelect> {
    const db = tx ? tx : this.db;

    const insertResult = await db.insert(accountBalances).values(accountBalanceInsert).returning();
    const insertedBalance = insertResult.at(0);

    if (!insertedBalance)
      throw new Error(
        `Inserting account balance for accountId: ${accountBalanceInsert.accountId} failed.`,
      );

    return insertedBalance;
  }

  public async updateAccountBalance(
    accountId: number,
    amount: number,
    tx?: PgliteTransaction,
  ): Promise<AccountBalanceSelect> {
    let currentBalance = await this.getAccountBalance(accountId, tx);

    if (!currentBalance) {
      currentBalance = await this.insertAccountBalance(
        {
          accountId,
          balance: '0',
        },
        tx,
      );
    }

    const updateObj = { accountId, balance: currentBalance.balance + amount, updateAt: new Date() };

    let updateAccountBalances: AccountBalanceSelect[];
    if (tx) {
      updateAccountBalances = await tx.update(accountBalances).set(updateObj).returning();
    } else {
      updateAccountBalances = await this.db.update(accountBalances).set(updateObj).returning();
    }

    return updateAccountBalances.at(0)!;
  }
}

// export class TestAccountsRepository extends AccountsRepository {
//   constructor(testDB: PgliteDrizzle) {
//     super();
//     this.db = testDB;
//   }
// }

import { accountBalances, accounts } from '@/db/drizzle/schema';
import type {
  AccountBalanceInsert,
  AccountBalanceSelect,
  AccountGroupType,
  AccountInsert,
  AccountSelectAll,
} from '@/db/drizzle/types';
import { Repository } from './abstract-repository';

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

  public async getAccountBalance(targetAccountId: number) {
    return await this.db.query.accountBalances.findFirst({
      where: ({ accountId }, { eq }) => eq(accountId, targetAccountId),
    });
  }

  public async insertAccountBalance(
    accountBalanceInsert: AccountBalanceInsert,
  ): Promise<AccountBalanceSelect> {
    const insertResult = await this.db
      .insert(accountBalances)
      .values(accountBalanceInsert)
      .returning();
    const insertedBalance = insertResult.at(0);

    if (!insertedBalance)
      throw new Error(
        `Inserting account balance for accountId=${accountBalanceInsert.accountId} failed.`,
      );

    return insertedBalance;
  }

  public async updateAccountBalance(
    accountId: number,
    amount: number,
  ): Promise<AccountBalanceSelect> {
    const updatedAccountBalance: AccountBalanceSelect[] = await this.db
      .update(accountBalances)
      .set({
        accountId,
        balance: amount,
        updateAt: new Date(),
      })
      .returning();

    return updatedAccountBalance.at(0)!;
  }
}

import { accountGroups, accounts, assetLiabilityBalances } from '@/db/drizzle/schema';
import type {
  AccountBalanceInsert,
  AccountBalanceSelect,
  AccountGroupInsert,
  AccountGroupType,
  AccountInsert,
  AccountSelectAll,
  AccountSelectAllTx,
} from '@/db/drizzle/types';
import { eq } from 'drizzle-orm';
import { Repository } from './abstract-repository';
import { writeOperationLog } from './repository-decorators';

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

  public async getAccountById(
    id: string,
    includeTransactions: boolean = false,
  ): Promise<AccountSelectAll | AccountSelectAllTx | undefined> {
    if (includeTransactions) {
      return await this.db.query.accounts.findFirst({
        where: (accounts, { eq }) => eq(accounts.id, id),
        with: {
          currency: true,
          country: true,
          group: true,
          balance: true,
          transactions: true,
        },
      });
    }

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

  public async getAccountsByCountryId(id: string) {
    return await this.db.query.accounts.findMany({
      where: ({ countryId }, { eq }) => eq(countryId, id),
    });
  }

  @writeOperationLog
  public async insertAccount(insert: AccountInsert) {
    const result = await this.db.insert(accounts).values(insert).returning();
    return result.at(0);
  }

  @writeOperationLog
  public async updateAccount(update: Partial<AccountInsert>) {
    const result = await this.db
      .update(accounts)
      .set({
        ...update,
        id: undefined,
      })
      .where(eq(accounts.id, update.id!))
      .returning();
    return result.at(0);
  }

  @writeOperationLog
  public async archiveAccount(accountId: string) {
    const result = await this.db
      .update(accounts)
      .set({ isArchive: true })
      .where(eq(accounts.id, accountId))
      .returning();
    return result.at(0);
  }

  @writeOperationLog
  public async deleteAccount(accountId: string) {
    const result = await this.db.delete(accounts).where(eq(accounts.id, accountId)).returning();
    return result.at(0);
  }

  public async getAccountGroup(_id: string) {
    return this.db.query.accountGroups.findFirst({
      where: ({ id }, { eq }) => eq(id, _id),
      with: {
        childGroups: true,
        accounts: {
          with: {
            currency: true,
            country: true,
            group: true,
            balance: true,
          },
        },
      },
    });
  }

  public async getAccountGroupsByType(
    groupTypes: AccountGroupType[],
    includeHidden: boolean = false,
    isFlatten: boolean = true,
    withGroup: boolean = true,
  ) {
    const resultWithGroup = this.db.query.accountGroups.findMany({
      where: ({ parentGroupId, type, isHidden }, { and, eq, isNull, inArray }) =>
        isFlatten
          ? and(eq(isHidden, includeHidden), inArray(type, groupTypes), isNull(parentGroupId))
          : and(eq(isHidden, includeHidden), inArray(type, groupTypes)),
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

    return withGroup
      ? await resultWithGroup
      : await (this.db.query.accountGroups.findMany({
          where: ({ parentGroupId, type, isHidden }, { and, eq, isNull, inArray }) =>
            isFlatten
              ? and(eq(isHidden, includeHidden), inArray(type, groupTypes), isNull(parentGroupId))
              : and(eq(isHidden, includeHidden), inArray(type, groupTypes)),
        }) as typeof resultWithGroup);
  }

  public async getAllAccountGroups() {
    return this.db.query.accountGroups.findMany({
      where: ({ parentGroupId }, { isNull }) => isNull(parentGroupId),
      with: {
        childGroups: true,
        accounts: {
          with: {
            currency: true,
            country: true,
            group: true,
            balance: true,
          },
        },
      },
    });
  }

  @writeOperationLog
  public async insertAccountGroup(form: AccountGroupInsert) {
    return await this.db.insert(accountGroups).values(form).returning();
  }

  public async getAccountBalance(targetAccountId: string) {
    return await this.db.query.assetLiabilityBalances.findFirst({
      where: ({ accountId }, { eq }) => eq(accountId, targetAccountId),
    });
  }

  @writeOperationLog
  public async insertAccountBalance(
    accountBalanceInsert: AccountBalanceInsert,
  ): Promise<AccountBalanceSelect> {
    const insertResult = await this.db
      .insert(assetLiabilityBalances)
      .values(accountBalanceInsert)
      .returning();
    const insertedBalance = insertResult.at(0);

    if (!insertedBalance)
      throw new Error(
        `Inserting account balance for accountId=${accountBalanceInsert.accountId} failed.`,
      );

    return insertedBalance;
  }

  @writeOperationLog
  public async updateAccountBalance(
    accountBalanceId: string,
    amount: number,
  ): Promise<AccountBalanceSelect> {
    const updatedAccountBalance: AccountBalanceSelect[] = await this.db
      .update(assetLiabilityBalances)
      .set({
        balance: amount,
        updateAt: new Date(),
      })
      .where(eq(assetLiabilityBalances.id, accountBalanceId))
      .returning();

    return updatedAccountBalance.at(0)!;
  }
}

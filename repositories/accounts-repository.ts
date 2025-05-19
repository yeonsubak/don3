import { accountBalances, accountGroups, accounts } from '@/db/drizzle/schema';
import type {
  AccountBalanceInsert,
  AccountBalanceSelect,
  AccountGroupInsert,
  AccountGroupType,
  AccountInsert,
  AccountSelectAll,
} from '@/db/drizzle/types';
import { eq } from 'drizzle-orm';
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

  public async getAccountById(id: string): Promise<AccountSelectAll> {
    const result = await this.db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, id),
      with: {
        currency: true,
        country: true,
        group: true,
        balance: true,
      },
    });

    if (!result)
      throw new Error('The result of AccountsRepository.getAccountById() method is null.');
    return result;
  }

  public async insertAccount(insert: AccountInsert) {
    const result = await this.db.insert(accounts).values(insert).returning();
    return result.at(0);
  }

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

  public async archiveAccount(accountId: string) {
    const result = await this.db
      .update(accounts)
      .set({ isArchive: true })
      .where(eq(accounts.id, accountId))
      .returning();
    return result.at(0);
  }

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

  public async insertAccountGroup(form: AccountGroupInsert) {
    return await this.db.insert(accountGroups).values(form).returning();
  }

  public async getAccountBalance(targetAccountId: string) {
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
    accountBalanceId: string,
    amount: number,
  ): Promise<AccountBalanceSelect> {
    const updatedAccountBalance: AccountBalanceSelect[] = await this.db
      .update(accountBalances)
      .set({
        balance: amount,
        updateAt: new Date(),
      })
      .where(eq(accountBalances.id, accountBalanceId))
      .returning();

    return updatedAccountBalance.at(0)!;
  }
}

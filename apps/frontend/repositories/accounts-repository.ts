import type {
  AccountBalanceInsert,
  AccountGroupInsert,
  AccountGroupType,
  AccountInsert,
  AccountSelectAll,
  AccountSelectAllTx,
  AppSchema,
} from '@/db/app-db/drizzle-types';
import { accountGroups, accounts, assetLiabilityBalances } from '@/db/app-db/schema';
import { eq } from 'drizzle-orm';
import { Repository } from './abstract-repository';
import { writeOpLog } from './repository-decorators';

export class AccountsRepository extends Repository<AppSchema> {
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

  @writeOpLog('getAccountsByCountry', 'getAllAccounts', 'getAllAccountGroups')
  public insertAccount(data: AccountInsert) {
    return this.db
      .insert(accounts)
      .values({ id: crypto.randomUUID(), ...data })
      .returning();
  }

  @writeOpLog('getAccountsByCountry', 'getAllAccounts', 'getAllAccountGroups')
  public updateAccount(data: Partial<AccountInsert>) {
    return this.db
      .update(accounts)
      .set({
        ...data,
        id: undefined,
        updateAt: new Date(),
      })
      .where(eq(accounts.id, data.id!))
      .returning();
  }

  @writeOpLog('getAccountsByCountry', 'getAllAccounts', 'getAllAccountGroups')
  public deleteAccount(accountId: string) {
    return this.db.delete(accounts).where(eq(accounts.id, accountId)).returning();
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

  @writeOpLog('getAccountsByCountry', 'getAllAccounts', 'getAllAccountGroups')
  public insertAccountGroup(data: AccountGroupInsert) {
    return this.db
      .insert(accountGroups)
      .values({ id: crypto.randomUUID(), ...data })
      .returning();
  }

  public async getAccountBalance(targetAccountId: string) {
    return await this.db.query.assetLiabilityBalances.findFirst({
      where: ({ accountId }, { eq }) => eq(accountId, targetAccountId),
    });
  }

  @writeOpLog('getAccountsByCountry', 'getAllAccounts', 'getAllAccountGroups')
  public insertAccountBalance(data: AccountBalanceInsert) {
    return this.db
      .insert(assetLiabilityBalances)
      .values({ id: crypto.randomUUID(), ...data })
      .returning();
  }

  @writeOpLog('getAccountsByCountry', 'getAllAccounts', 'getAllAccountGroups')
  public updateAccountBalance(accountBalanceId: string, amount: number) {
    return this.db
      .update(assetLiabilityBalances)
      .set({
        balance: amount,
        updateAt: new Date(),
      })
      .where(eq(assetLiabilityBalances.id, accountBalanceId))
      .returning();
  }
}

import { accounts } from '@/db/drizzle/schema';
import type { AccountGroupType, AccountInsert, AccountSelectAll } from '@/db/drizzle/types';
import { Repository } from './abstract-repository';

export class AccountsRepository extends Repository {
  protected static instance: AccountsRepository;

  private constructor() {
    super();
  }

  protected static async createInstance(): Promise<AccountsRepository> {
    if (!AccountsRepository.instance) {
      AccountsRepository.instance = new AccountsRepository();
    }

    return AccountsRepository.instance;
  }

  public async getAllAccounts(): Promise<AccountSelectAll[]> {
    return await this.db.query.accounts.findMany({
      with: {
        currency: true,
        country: true,
        group: true,
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
          },
        },
      },
    });
  }
}

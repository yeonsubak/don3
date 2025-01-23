import type { ACCOUNT_FORM_SCHEMA } from '@/components/compositions/manage-accounts/manage-account-card';
import { accounts, countries, currencies } from '@/db/drizzle/schema';
import type {
  AccountGroupSelectWithRelations,
  AccountGroupType,
  AccountSelectWithRelations,
} from '@/db/drizzle/types';
import type { PgliteDrizzle } from '@/db/pglite-drizzle';
import { eq } from 'drizzle-orm';
import type { z } from 'zod';
import { Service } from './service-primitive';

export class AccountsService extends Service {
  constructor(drizzle: PgliteDrizzle) {
    super(drizzle);
  }

  public async getAllAccounts() {
    return await this.drizzle.getDb().query.accounts.findMany({
      with: {
        currency: true,
        country: true,
        group: true,
      },
    });
  }

  public async createAccount(data: z.infer<typeof ACCOUNT_FORM_SCHEMA>) {
    const currency = await this.drizzle.getDb().query.currencies.findFirst({
      where: eq(currencies.code, data.currencyCode),
    });
    const country = await this.drizzle.getDb().query.countries.findFirst({
      where: eq(countries.code, data.countryCode),
    });

    if (!currency) {
      throw new Error('Currency not found');
    }

    if (!country) {
      throw new Error('Country not found');
    }

    const insertObj: typeof accounts.$inferInsert = {
      type: data.accountType,
      name: data.accountName,
      currencyId: currency.id,
      countryId: country.id,
    };

    const insertStart = new Date();
    const result = await this.drizzle.getDb().insert(accounts).values(insertObj).returning();
    const insertEnd = new Date();
    console.log('insert', insertEnd.getTime() - insertStart.getTime() + 'ms');

    return result;
  }

  public async getAcountsByCountry(groupType: AccountGroupType): Promise<GroupAccountsByCountry> {
    const accountGroups = await this.getAccountGroupsByType(groupType);
    const groupedByCountry: GroupAccountsByCountry = {};

    accountGroups.forEach((group) => {
      const countryCodesInUse = new Set(
        group.accounts.map((account: AccountSelectWithRelations) => account.country.code),
      );

      countryCodesInUse.forEach((countryCode) => {
        if (!groupedByCountry[countryCode]) {
          groupedByCountry[countryCode] = [];
        }

        groupedByCountry[countryCode].push({
          ...group,
          accounts: group.accounts.filter(
            (account: AccountSelectWithRelations) => account.country.code === countryCode,
          ),
        });
      });
    });

    return groupedByCountry;
  }

  public async getAccountGroupsByType(
    groupType: AccountGroupType,
    includeHidden: boolean = false,
    isFlatten: boolean = true,
  ): Promise<AccountGroupSelectWithRelations[]> {
    return (await this.drizzle.getDb().query.accountGroups.findMany({
      where: ({ parentGroupId, type, isHidden }, { and, eq, isNull }) =>
        isFlatten
          ? and(eq(isHidden, includeHidden), eq(type, groupType), isNull(parentGroupId))
          : and(eq(isHidden, includeHidden), eq(type, groupType)),
      with: {
        accounts: {
          with: {
            country: true,
            currency: true,
          },
        },
        childGroups: true,
      },
    })) as AccountGroupSelectWithRelations[];
  }

  public async getAccountById(id: number) {
    return await this.drizzle.getDb().query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, id),
    });
  }
}

type countryCode = string;
export type GroupAccountsByCountry = Record<countryCode, AccountGroupSelectWithRelations[]>;

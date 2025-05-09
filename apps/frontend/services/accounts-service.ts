'use client';

import type { CreateAccountForm } from '@/components/page/accounts/form-schema';
import type { CreateAccountGroupForm } from '@/components/page/groups/form-schema';
import type {
  AccountGroupSelect,
  AccountGroupSelectAll,
  AccountGroupType,
  AccountSelectAll,
} from '@/db/drizzle/types';
import { AccountsRepository } from '../repositories/accounts-repository';
import type { ConfigRepository } from '../repositories/config-repository';
import { Service } from './abstract-service';

export class AccountsService extends Service {
  private accountsRepository: AccountsRepository;
  private configRepository: ConfigRepository;

  constructor(accountsRepository: AccountsRepository, configRepository: ConfigRepository) {
    super();
    this.accountsRepository = accountsRepository;
    this.configRepository = configRepository;
  }

  public async getAllAccounts() {
    return await this.accountsRepository.getAllAccounts();
  }

  public async insertAccount({
    accountGroupId,
    currencyCode,
    countryCode,
    accountType,
    accountName,
    icon,
  }: CreateAccountForm): Promise<AccountSelectAll | undefined> {
    const currency = await this.configRepository.getCurrencyByCode(currencyCode);
    const country = await this.configRepository.getCountryByCode(countryCode);

    if (!currency) throw new Error('Currency not found');
    if (!country) throw new Error('Country not found');

    const insertedAccount = await this.accountsRepository.withTx(async (tx) => {
      try {
        const accountsRepoWithTx = new AccountsRepository(tx);

        const insertedAccount = await accountsRepoWithTx.insertAccount({
          accountGroupId: parseInt(accountGroupId),
          type: accountType,
          name: accountName,
          currencyId: currency.id,
          countryId: country.id,
          icon,
        });

        if (!insertedAccount) throw new Error('Insert account failed');

        const insertedAccountBalance = await accountsRepoWithTx.insertAccountBalance({
          accountId: insertedAccount.id,
          balance: 0,
        });

        if (!insertedAccountBalance) throw new Error('Insert account_balance failed');

        return await accountsRepoWithTx.getAccountById(insertedAccount.id);
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return insertedAccount;
  }

  public async getAcountsByCountry(groupType: AccountGroupType): Promise<GroupAccountsByCountry> {
    const accountGroups = await this.accountsRepository.getAccountGroupsByType(groupType);
    const groupedByCountry: GroupAccountsByCountry = {};

    accountGroups.forEach((group) => {
      const countryCodesInUse = new Set(group.accounts.map((account) => account.country.code));

      countryCodesInUse.forEach((countryCode) => {
        if (!groupedByCountry[countryCode]) {
          groupedByCountry[countryCode] = [];
        }

        groupedByCountry[countryCode].push({
          ...group,
          accounts: group.accounts.filter((account) => account.country.code === countryCode),
        });
      });
    });

    return groupedByCountry;
  }

  public async getAccountGroup(id: number) {
    return this.accountsRepository.getAccountGroup(id);
  }

  public async getAllAccountGroups(): Promise<AccountGroupSelectAll[]> {
    return this.accountsRepository.getAllAccountGroups();
  }

  public async insertAccountGroup({ name, type, description }: CreateAccountGroupForm) {
    const result = (
      await this.accountsRepository.insertAccountGroup({
        parentGroupId: null,
        name,
        type,
        description,
      })
    ).at(0);

    if (!result) {
      throw new Error('Insert account_group failed');
    }

    return this.getAccountGroup(result.id);
  }
}

export type GroupAccountsByCountry = Record<
  string,
  AccountGroupSelect<{
    childGroups: true;
    accounts: {
      with: {
        country: true;
        currency: true;
        balance: true;
      };
    };
  }>[]
>;

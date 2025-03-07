'use client';

import type {
  AccountGroupSelectRelations,
  AccountGroupType,
  AccountInsert,
} from '@/db/drizzle/types';
import type { z } from 'zod';
import { AccountsRepository } from '../repositories/accounts-repository';
import type { ConfigRepository } from '../repositories/config-repository';
import { Service } from './abstract-service';
import type { CreateAccountForm } from '@/components/compositions/manage-accounts/form-schema';

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

  public async createAccount(form: CreateAccountForm) {
    const { currencyCode, countryCode, accountType, accountName } = form;

    const currency = await this.configRepository.getCurrencyByCode(currencyCode);
    const country = await this.configRepository.getCountryByCode(countryCode);

    if (!currency) throw new Error('Currency not found');
    if (!country) throw new Error('Country not found');

    const accountInsert: AccountInsert = {
      type: accountType,
      name: accountName,
      currencyId: currency.id,
      countryId: country.id,
    };

    return await this.accountsRepository.insertAccount(accountInsert);
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
}

export type GroupAccountsByCountry = Record<
  string,
  AccountGroupSelectRelations<{
    childGroups: true;
    accounts: {
      with: {
        country: true;
        currency: true;
      };
    };
  }>[]
>;

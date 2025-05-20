'use client';

import type { AccountFormSchema } from '@/components/page/accounts/drawer/account-form-schema';
import type { CreateAccountGroupForm } from '@/components/page/groups/form-schema';
import type {
  AccountGroupSelect,
  AccountGroupSelectAll,
  AccountGroupType,
  AccountSelectAll,
  AccountSelectAllTx,
} from '@/db/drizzle/types';
import type { TransactionRepository } from '@/repositories/transaction-repository';
import { AccountsRepository } from '../repositories/accounts-repository';
import type { ConfigRepository } from '../repositories/config-repository';
import { Service } from './abstract-service';

export class AccountsService extends Service {
  private accountsRepository: AccountsRepository;
  private configRepository: ConfigRepository;
  private transactionRepository: TransactionRepository;

  constructor(
    accountsRepository: AccountsRepository,
    configRepository: ConfigRepository,
    transactionRepository: TransactionRepository,
  ) {
    super();
    this.accountsRepository = accountsRepository;
    this.configRepository = configRepository;
    this.transactionRepository = transactionRepository;
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
  }: AccountFormSchema): Promise<AccountSelectAll> {
    const currency = await this.configRepository.getCurrencyByCode(currencyCode);
    const country = await this.configRepository.getCountryByCode(countryCode);

    if (!currency) throw new Error('Currency not found');
    if (!country) throw new Error('Country not found');

    const insertedAccount = await this.accountsRepository.withTx(async (tx) => {
      try {
        const accountsRepoWithTx = new AccountsRepository(tx);

        const insertedAccount = await accountsRepoWithTx.insertAccount({
          accountGroupId: accountGroupId,
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

        if (!insertedAccountBalance)
          throw new Error('The result of AccountsRepository.insertAccountBalance() method is null');

        return await accountsRepoWithTx.getAccountById(insertedAccount.id);
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    if (!insertedAccount)
      throw new Error('The result of AccountsRepository.insertAccount() method is null.');

    return insertedAccount;
  }

  public async updateAccount(update: AccountFormSchema) {
    const isValidForm = Object.values(update).every((value) => !!value);
    if (!isValidForm)
      throw new Error('The submitted form for updating an account is invalid.', {
        cause: { value: JSON.stringify(update) },
      });

    const currency = await this.configRepository.getCurrencyByCode(update.currencyCode);
    const country = await this.configRepository.getCountryByCode(update.countryCode);
    if (!currency) throw new Error('Currency not found');
    if (!country) throw new Error('Country not found');

    const result = await this.accountsRepository.updateAccount({
      id: update.accountId!,
      accountGroupId: update.accountGroupId,
      name: update.accountName,
      type: update.accountType,
      currencyId: currency.id,
      countryId: country.id,
      icon: update.icon,
    });

    if (!result)
      throw new Error('The result of AccountsRepository.updateAccount() method is null.');

    return await this.accountsRepository.getAccountById(result.id);
  }

  public async archiveAccount(accountId: string) {
    const result = await this.accountsRepository.updateAccount({
      id: accountId,
      isArchive: true,
    });

    if (!result)
      throw new Error('The result of AccountsRepository.updateAccount() method is null.');

    return await this.accountsRepository.getAccountById(result.id);
  }

  public async reactivateAccount(accountId: string) {
    const result = await this.accountsRepository.updateAccount({
      id: accountId,
      isArchive: false,
    });

    if (!result)
      throw new Error('The result of AccountsRepository.updateAccount() method is null.');

    return await this.accountsRepository.getAccountById(result.id);
  }

  public async deleteAccount(accountId: string) {
    const targetAccount = (await this.accountsRepository.getAccountById(
      accountId,
      true,
    )) as AccountSelectAllTx;
    const journalEntryIds = targetAccount?.transactions?.flatMap((tx) => tx.journalEntryId);

    if (journalEntryIds) {
      await this.transactionRepository.deleteJournalEntries(journalEntryIds);
    }

    const result = await this.accountsRepository.deleteAccount(accountId);
    if (!result)
      throw new Error('The result of AccountsRepository.deleteAccount() method is null.');

    return result;
  }

  public async getAcountsByCountry(
    groupType: AccountGroupType,
    includeArchived: boolean,
  ): Promise<GroupAccountsByCountry> {
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
          accounts: group.accounts.filter(
            (account) =>
              (includeArchived || !account.isArchive) && account.country.code === countryCode,
          ),
        });
      });
    });

    return groupedByCountry;
  }

  public async getAccountGroup(id: string) {
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

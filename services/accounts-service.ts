'use client';

import type { AccountFormSchema } from '@/app/app/accounts/components/drawer/account-form';
import type { CreateAccountGroupForm } from '@/app/app/accounts/components/drawer/add-account-group-form';
import type {
  AccountGroupSelect,
  AccountGroupSelectAll,
  AccountGroupType,
  AccountSelectAll,
  AccountSelectAllTx,
  CountrySelect,
} from '@/db/app-db/drizzle-types';
import type { TransactionRepository } from '@/repositories/transaction-repository';
import type { DateRange } from 'react-day-picker';
import { AccountsRepository } from '../repositories/accounts-repository';
import { ConfigRepository } from '../repositories/config-repository';
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

  public async insertAccount(
    {
      accountGroupId,
      currencyCode,
      countryCode,
      accountType,
      accountName,
      icon,
    }: AccountFormSchema,
    groupType: AccountGroupType,
  ): Promise<AccountSelectAll> {
    const currency = await this.configRepository.getCurrencyByCode(currencyCode);
    const country = await this.configRepository.getCountryByCode(countryCode);

    if (!currency) throw new Error('Currency not found');
    if (!country) throw new Error('Country not found');

    const insertedAccount = await this.accountsRepository.withTx(async (tx) => {
      try {
        const accountsRepoWithTx = new AccountsRepository(tx);
        const configRepoWithTx = new ConfigRepository(tx);

        const countriesInUse = await configRepoWithTx.getContriesInUse();
        const insertedAccount = await accountsRepoWithTx.insertAccount({
          accountGroupId: accountGroupId,
          type: accountType,
          name: accountName,
          currencyId: currency.id,
          countryId: country.id,
          icon,
        });

        if (!insertedAccount) throw new Error('Insert account failed');

        if (groupType === 'asset' || groupType === 'liability') {
          await this.insertAccountBalance(insertedAccount.id, accountsRepoWithTx);
          if (countriesInUse.findIndex((inUse) => inUse.id === country.id) === -1) {
            await this.copyIncomeExpenseAccounts(country, accountsRepoWithTx, configRepoWithTx);
          }
        }

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
    const accountGroups = await this.accountsRepository.getAccountGroupsByType([groupType]);
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

  public async getBalanceByType(type: AccountGroupType, dates: DateRange) {
    if (['asset', 'liability', 'uncategorized'].includes(type)) {
      throw new Error(`The account group type ${type} should not use this method.`);
    }

    const accountGroups = await this.accountsRepository.getAccountGroupsByType([type]);
    const accountIds = accountGroups.flatMap((group) =>
      group.accounts.flatMap((account) => account.id),
    );
    const balanceMap: Record<string, number> = Object.fromEntries(accountIds.map((id) => [id, 0]));

    const entryType = type === 'expense' ? 'expense' : 'income';
    const journalEntries = await this.transactionRepository.getJournalEntries(
      [entryType],
      dates,
      true,
    );
    const transactions = journalEntries
      .flatMap((entry) => entry.transactions)
      .filter((tx) => tx.type === 'credit');

    transactions.forEach((tx) => {
      balanceMap[tx.accountId] += tx.amount;
    });

    return balanceMap;
  }

  private async insertAccountBalance(accountId: string, accountsRepo?: AccountsRepository) {
    const insertObj = { accountId, balance: 0 };

    const insertedAccountBalance = accountsRepo
      ? await accountsRepo.insertAccountBalance(insertObj)
      : await this.accountsRepository.insertAccountBalance(insertObj);

    if (!insertedAccountBalance)
      throw new Error('The result of AccountsRepository.insertAccountBalance() method is null');
  }

  /**
   * Copies existing income and expense accounts when a new country is added.
   * This method reduces the need for manually recreating commonly used accounts, ensuring consistency across countries.
   */
  private async copyIncomeExpenseAccounts(
    targetCountry: CountrySelect,
    accountsRepoTx?: AccountsRepository,
    configRepoTx?: ConfigRepository,
  ) {
    const accountsRepo = accountsRepoTx ? accountsRepoTx : this.accountsRepository;
    const configRepo = configRepoTx ? configRepoTx : this.configRepository;

    const defaultCountryCode = await configRepo.getUserConfig('defaultCountry');
    if (!defaultCountryCode) throw new Error('Default country cannot be found in the database');

    const defaultCountry = await configRepo.getCountryByCode(defaultCountryCode.value);
    const accountGroups = await accountsRepo.getAccountGroupsByType(['income', 'expense'])!;
    const groupIds = accountGroups.flatMap((group) => group.id);
    const accounts = await accountsRepo.getAccountsByCountryId(defaultCountry!.id);

    const targetAccounts = accounts.filter((account) => groupIds.includes(account.accountGroupId));

    await Promise.all(
      targetAccounts.map((account) =>
        accountsRepo.insertAccount({
          ...account,
          id: undefined,
          countryId: targetCountry.id,
          currencyId: targetCountry.defaultCurrencyId!,
        }),
      ),
    );
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

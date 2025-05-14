'use client';

import { parseNumber } from '@/components/common-functions';
import type {
  ExpenseTxForm,
  FundTransferTxForm,
  IncomeTxForm,
} from '@/components/page/transactions/add-drawer/forms/form-schema';
import type { CurrencySelect, JournalEntryType, TransactionInsert } from '@/db/drizzle/types';
import { AccountsRepository } from '../repositories/accounts-repository';
import { TransactionRepository } from '../repositories/transaction-repository';
import { Service } from './abstract-service';
import type { ConfigService } from './config-service';

export class TransactionService extends Service {
  private transactionRepository: TransactionRepository;
  private accountsRepository: AccountsRepository;
  private configService: ConfigService;

  protected static instance: TransactionService;

  constructor(
    transactionRepository: TransactionRepository,
    accountsRepository: AccountsRepository,
    configService: ConfigService,
  ) {
    super();
    this.transactionRepository = transactionRepository;
    this.accountsRepository = accountsRepository;
    this.configService = configService;
  }

  public async getSummary(from: Date, to: Date, baseCurrency: CurrencySelect) {
    const entries = await this.transactionRepository.getJournalEntries(['income', 'expense'], {
      from,
      to,
    });
    const diffCurrencies = entries
      .map((entry) => entry.currency)
      .filter((currency) => currency.id !== baseCurrency.id);

    if (entries.length === 0) {
      return {
        income: 0,
        expense: 0,
      };
    }

    const fxRates =
      diffCurrencies.length > 0
        ? await this.configService.getLatestFxRate(baseCurrency, diffCurrencies)
        : null;

    const calculateSummary = (
      entries: Awaited<ReturnType<typeof this.transactionRepository.getJournalEntries>>,
    ) =>
      entries.reduce((acc, cur) => {
        if (cur.currencyId !== baseCurrency.id) {
          const fxRate = fxRates?.find((fx) => fx.targetCurrency === cur.currency.code);
          const parsedRate = parseNumber(fxRate?.rate ?? '', 10) ?? 1;
          return acc + cur.amount / parsedRate;
        }

        return acc + cur.amount;
      }, 0);

    const incomeSummary = calculateSummary(entries.filter((entry) => entry.type === 'income'));
    const expenseSummary = calculateSummary(entries.filter((entry) => entry.type === 'expense'));

    return {
      income: Number(incomeSummary.toFixed(baseCurrency.isoDigits)),
      expense: Number(expenseSummary.toFixed(baseCurrency.isoDigits)),
    };
  }

  public async getJournalEntries(
    entryTypes: JournalEntryType[],
    dateRange: { from?: Date; to?: Date },
    includeTx: boolean = false,
  ) {
    const { from, to } = dateRange;
    if (!from || !to) throw new Error('Invalid date range');

    return this.transactionRepository.getJournalEntries(entryTypes, { from, to }, includeTx);
  }

  public async insertTransaction(form: IncomeTxForm | ExpenseTxForm | FundTransferTxForm) {
    const {
      debitAccountId,
      creditAccountId,
      currencyCode,
      journalEntryType,
      fxAmount,
      fxRate,
      amount,
    } = form;

    // Validate the data from the form
    const debitAccount = await this.accountsRepository.getAccountById(debitAccountId);
    if (!debitAccount) throw new Error('Invalid debit account');

    const baseCurrency = debitAccount.currency;
    const formCurrency = await this.configService.getCurrencyByCode(currencyCode);
    if (!formCurrency) throw new Error('Failed to fetch currency');

    const parsedAmount = parseNumber(fxRate ? fxAmount : amount, baseCurrency.isoDigits);
    if (!parsedAmount) throw new Error('Invalid amount');

    // Insert records on tables: journal_entry, journal_entry_fx_rates, transactions and update the balance of the account.
    // If any of the operation fails, all DB transactions are nullified by rollback.
    const entryId = await this.transactionRepository.withTx(async (tx) => {
      try {
        const transactionRepoWithTx = new TransactionRepository(tx);

        const journalEntry = await transactionRepoWithTx.insertJournalEntry(
          baseCurrency.id,
          parsedAmount,
          form,
        );
        if (!journalEntry) throw new Error('Insert to journal Entry failed');

        if (fxRate) {
          const parsedFxRate = parseNumber(fxRate, 10);
          if (!parsedFxRate) throw new Error('Invalid FxRate');
          await this.transactionRepository.insertJournalEntryFxRate({
            journalEntryId: journalEntry.id,
            baseCurrencyId: debitAccount.currency.id,
            targetCurrencyId: formCurrency.id,
            rate: parsedFxRate,
          });
        }

        const debitTransaction: TransactionInsert = {
          type: 'debit',
          journalEntryId: journalEntry.id,
          accountId: debitAccountId,
          amount: parsedAmount,
        };

        const creditTransaction: TransactionInsert = {
          type: 'credit',
          journalEntryId: journalEntry.id,
          accountId: creditAccountId,
          amount: parsedAmount,
        };

        await Promise.all([
          transactionRepoWithTx.insertTransaction(debitTransaction),
          transactionRepoWithTx.insertTransaction(creditTransaction),
        ]);

        async function updateAccountBalance(
          accountId: string,
          amount: number,
          accountsRepo: AccountsRepository,
        ) {
          const accountBalance = await accountsRepo.getAccountBalance(accountId);
          if (!accountBalance) {
            return await accountsRepo.insertAccountBalance({ accountId, balance: amount });
          }

          return await accountsRepo.updateAccountBalance(
            accountBalance.id,
            accountBalance.balance + amount,
          );
        }

        // Update balance
        const accountsRepoWithTx = new AccountsRepository(tx);
        let debitAmount = debitTransaction.amount * (journalEntryType === 'expense' ? -1 : 1);
        let creditAmount = creditTransaction.amount * (journalEntryType === 'transfer' ? -1 : 1);

        await updateAccountBalance(debitAccountId, debitAmount, accountsRepoWithTx);
        await updateAccountBalance(creditAccountId, creditAmount, accountsRepoWithTx);

        return journalEntry.id;
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return await this.transactionRepository.getJournalEntryById(entryId ?? '');
  }

  public async updateBalance() {}
}

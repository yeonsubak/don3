'use client';

import type {
  ExpenseTxForm,
  FundTransferTxForm,
  IncomeTxForm,
} from '@/app/app/transactions/components/drawer/forms/form-schema';
import { parseNumber } from '@/components/common-functions';
import type {
  CurrencySelect,
  JournalEntryType,
  TransactionInsert,
} from '@/db/app-db/drizzle-types';
import { DateTime } from 'luxon';
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
        ? await this.configService.getLatestFxRate([baseCurrency], diffCurrencies)
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
      date,
      description,
      time,
      title,
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

        const dateTime = DateTime.fromJSDate(date).set({
          hour: time.hour,
          minute: time.minute,
          second: 0,
        });

        const journalEntry = (
          await transactionRepoWithTx.insertJournalEntry({
            type: journalEntryType,
            date: dateTime.toJSDate(),
            title,
            description,
            currencyId: baseCurrency.id,
            amount: parsedAmount,
          })
        ).at(0);

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
            return (await accountsRepo.insertAccountBalance({ accountId, balance: amount })).at(0);
          }

          return (
            await accountsRepo.updateAccountBalance(
              accountBalance.id,
              accountBalance.balance + amount,
            )
          ).at(0);
        }

        // Update balance
        const accountsRepoWithTx = new AccountsRepository(tx);
        const debitAmount = debitTransaction.amount * (journalEntryType === 'expense' ? -1 : 1);
        const creditAmount = creditTransaction.amount * (journalEntryType === 'transfer' ? -1 : 1);

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

  public async updateTransaction(form: IncomeTxForm | ExpenseTxForm | FundTransferTxForm) {
    const {
      id,
      debitAccountId,
      creditAccountId,
      currencyCode,
      journalEntryType,
      fxAmount,
      fxRate,
      amount,
      date,
      description,
      time,
      title,
    } = form;

    if (!form.id) throw new Error('journal_entry_id is null.');

    const debitAccount = await this.accountsRepository.getAccountById(debitAccountId);
    if (!debitAccount) throw new Error('Invalid debit account');

    const baseCurrency = debitAccount.currency;
    const formCurrency = await this.configService.getCurrencyByCode(currencyCode);
    if (!formCurrency) throw new Error('Failed to fetch currency');

    const parsedAmount = parseNumber(fxRate ? fxAmount : amount, baseCurrency.isoDigits);
    if (!parsedAmount) throw new Error('Invalid amount');

    const journalEntry = await this.transactionRepository.getJournalEntryById(form.id);
    if (!journalEntry) throw new Error('journal_entry is not found');

    await this.transactionRepository.withTx(async (tx) => {
      try {
        const transactionRepoWithTx = new TransactionRepository(tx);

        if (journalEntry?.fxRate) {
          const parsedFxRate = parseNumber(fxRate, 10);
          if (!parsedFxRate) throw new Error('Invalid FxRate');

          await transactionRepoWithTx.updateJournalEntryFxRate({
            id: journalEntry.fxRate.id,
            journalEntryId: journalEntry.id,
            baseCurrencyId: debitAccount.currencyId,
            targetCurrencyId: formCurrency.id,
            rate: parsedFxRate,
          });
        }

        const dateTime = DateTime.fromJSDate(date).set({
          hour: time.hour,
          minute: time.minute,
          second: 0,
        });

        await Promise.all([
          transactionRepoWithTx.updateJournalEntry({
            id: id!,
            amount: parsedAmount,
            date: dateTime.toJSDate(),
            currencyId: baseCurrency.id,
            type: journalEntryType,
            title: title,
            description: description,
          }),
          transactionRepoWithTx.updateTransaction({
            type: 'debit',
            journalEntryId: id!,
            accountId: debitAccountId,
            amount: parsedAmount,
          }),
          transactionRepoWithTx.updateTransaction({
            type: 'credit',
            journalEntryId: id!,
            accountId: creditAccountId,
            amount: parsedAmount,
          }),
        ]);
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return await this.transactionRepository.getJournalEntryById(journalEntry.id);
  }

  public async deleteTransaction(journalEntryId: string) {
    return (await this.transactionRepository.deleteJournalEntries(journalEntryId)).at(0);
  }
}

'use client';

import { parseNumber } from '@/components/common-functions';
import type { TransactionForm } from '@/components/compositions/manage-transactions/add-transaction-drawer/form-schema';
import schema from '@/db/drizzle/schema';
import type {
  CurrencySelect,
  JournalEntryType,
  PgliteTransaction,
  TransactionInsert,
} from '@/db/drizzle/types';
import { DateTime } from 'luxon';
import { Service } from './abstract-service';
import { AccountsService } from './accounts-service';
import { ConfigService } from './config-service';

const { transactions, journalEntries, journalEntryFxRates } = schema;

export class TransactionService extends Service {
  protected static instance: TransactionService;

  private configService!: ConfigService;
  private accountsService!: AccountsService;

  private constructor() {
    super();
  }

  protected static async createInstance(): Promise<TransactionService> {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
      TransactionService.instance.configService = await ConfigService.getInstance();
      TransactionService.instance.accountsService = await AccountsService.getInstance();
    }

    return TransactionService.instance;
  }

  public async getIncomeSummary(from: Date, to: Date, baseCurrency: CurrencySelect) {
    const incomeEntries = await this.getJournalEntries('income', { from, to });

    return incomeEntries.reduce((acc, cur) => {
      return acc + (parseNumber(cur.amount, baseCurrency.isoDigits) ?? 0);
    }, 0);
  }

  public async getExpenseSummary(from: Date, to: Date, baseCurrency: CurrencySelect) {
    const expenseEntries = await this.getJournalEntries('expense', { from, to });
    return expenseEntries.reduce(
      (acc, cur) => acc + (parseNumber(cur.amount, baseCurrency.isoDigits) ?? 0),
      0,
    );
  }

  public async getJournalEntryById(id: number) {
    return await this.drizzle.query.journalEntries.findFirst({
      where: (journalEntries, { eq }) => eq(journalEntries.id, id),
      with: {
        transactions: true,
      },
    });
  }

  public async insertExpenseTransaction(form: TransactionForm) {
    const currency = await this.configService.getCurrencyByCode(form.currencyCode);
    const debitAccount = await this.accountsService.getAccountById(form.debitAccountId);
    if (!debitAccount) {
      throw new Error('Invalid debit account');
    }

    const entryId = await this.drizzle.transaction(async (tx) => {
      try {
        let amount = parseNumber(form.amount, currency?.isoDigits);

        if (!amount) {
          throw new Error('Invalid amount');
        }

        if (!currency) {
          throw new Error('Failed to fetch currency');
        }

        const journalEntry = await this.insertJournalEntry(tx, currency.id, amount, form);

        if (!journalEntry) {
          throw new Error('Insert to journal Entry failed');
        }

        if (form.fxRate) {
          const fxRate = parseNumber(form.fxRate, 10);
          if (!fxRate) {
            throw new Error('Invalid FxRate');
          }

          amount = amount * fxRate;

          tx.insert(journalEntryFxRates).values({
            journalEntryId: journalEntry.id,
            baseCurrencyId: debitAccount.currency.id,
            targetCurrencyId: currency.id,
            rate: fxRate.toFixed(10),
          });
        }

        const debitTransaction: TransactionInsert = {
          journalEntryId: journalEntry.id,
          accountId: form.creditAccountId,
          currencyId: currency.id,
          amount: amount.toFixed(currency.isoDigits),
        };

        const creditTransaction: TransactionInsert = {
          journalEntryId: journalEntry.id,
          accountId: form.debitAccountId,
          currencyId: currency.id,
          amount: (amount * -1).toFixed(currency.isoDigits),
        };

        await Promise.all([
          this.insertTransaction(tx, debitTransaction),
          this.insertTransaction(tx, creditTransaction),
        ]);

        return journalEntry.id;
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });
    return await this.getJournalEntryById(entryId ?? -1);
  }

  private async insertTransaction(tx: PgliteTransaction, data: TransactionInsert) {
    await tx.insert(transactions).values(data);
  }

  private async insertJournalEntry(
    tx: PgliteTransaction,
    currencyId: number,
    amount: number,
    { journalEntryType, date, time, title, description }: TransactionForm,
  ) {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const datetime = DateTime.fromJSDate(date, { zone: systemTimezone });
    datetime.set({ hour: time.hour, minute: time.minute, second: 0, millisecond: 0 });
    return (
      await tx
        .insert(journalEntries)
        .values({
          type: journalEntryType,
          date: datetime.toJSDate(),
          title,
          description,
          currencyId,
          amount: amount.toString(),
        })
        .returning()
    ).at(0);
  }

  private async getJournalEntries(
    entryType: JournalEntryType,
    { from, to }: { from: Date; to: Date },
  ) {
    return await this.drizzle.query.journalEntries.findMany({
      where: ({ date, type }, { between, and, eq }) =>
        and(eq(type, entryType), between(date, from, to)),
      with: {
        fxRate: true,
      },
    });
  }
}

'use client';

import { parseNumber } from '@/components/common-functions';
import type {
  ExpenseTxForm,
  IncomeTxForm,
} from '@/components/compositions/manage-transactions/add-transaction-drawer/forms/form-schema';
import schema from '@/db/drizzle/schema';
import type {
  CurrencySelect,
  JournalEntryTypeArray,
  PgliteTransaction,
  TransactionInsert,
} from '@/db/drizzle/types';
import { and, between, inArray } from 'drizzle-orm';
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

  public async getSummary(from: Date, to: Date, baseCurrency: CurrencySelect) {
    const entries = await this.getJournalEntries(['income', 'expense'], { from, to });
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

    const calculateSummary = (entries: Awaited<ReturnType<typeof this.getJournalEntries>>) =>
      entries.reduce((acc, cur) => {
        const amount = parseNumber(cur.amount, cur.currency.isoDigits) ?? 0;
        if (cur.currencyId !== baseCurrency.id) {
          const fxRate = fxRates?.find((fx) => fx.targetCurrency === cur.currency.code);
          const parsedRate = parseNumber(fxRate?.rate ?? '', 10) ?? 1;
          return acc + amount / parsedRate;
        }

        return acc + amount;
      }, 0);

    const incomeSummary = calculateSummary(entries.filter((entry) => entry.type === 'income'));
    const expenseSummary = calculateSummary(entries.filter((entry) => entry.type === 'expense'));

    return {
      income: Number(incomeSummary.toFixed(baseCurrency.isoDigits)),
      expense: Number(expenseSummary.toFixed(baseCurrency.isoDigits)),
    };
  }

  public async getJournalEntries(
    entryType: JournalEntryTypeArray,
    { from, to }: { from?: Date; to?: Date },
    includeTx: boolean = false,
  ) {
    if (!from || !to) throw new Error('Invalid date range');

    return await this.drizzle.query.journalEntries.findMany({
      where: ({ date, type }) => and(inArray(type, entryType), between(date, from, to)),
      with: {
        fxRate: true,
        currency: true,
        transactions: includeTx
          ? {
              with: {
                account: true,
              },
            }
          : undefined,
      },
    });
  }

  public async getJournalEntryById(id: number) {
    return await this.drizzle.query.journalEntries.findFirst({
      where: (journalEntries, { eq }) => eq(journalEntries.id, id),
      with: {
        transactions: {
          with: {
            account: true,
          },
        },
        currency: true,
        fxRate: true,
      },
    });
  }

  public async insertExpenseTransaction(form: ExpenseTxForm) {
    return this.insertTx(form, 'income');
  }

  public async insertIncomeTransaction(form: IncomeTxForm) {
    return this.insertTx(form, 'expense');
  }

  private async insertTx(form: IncomeTxForm | ExpenseTxForm, type: 'income' | 'expense') {
    const debitAccount = await this.accountsService.getAccountById(form.debitAccountId);
    if (!debitAccount) throw new Error('Invalid debit account');

    const baseCurrency = debitAccount.currency;
    const formCurrency = await this.configService.getCurrencyByCode(form.currencyCode);
    if (!formCurrency) throw new Error('Failed to fetch currency');

    const entryId = await this.drizzle.transaction(async (tx) => {
      try {
        let amount = parseNumber(form.fxRate ? form.fxAmount : form.amount, baseCurrency.isoDigits);
        if (!amount) throw new Error('Invalid amount');

        const journalEntry = await this.insertJournalEntry(tx, baseCurrency.id, amount, form);

        if (!journalEntry) throw new Error('Insert to journal Entry failed');

        if (form.fxRate) {
          const fxRate = parseNumber(form.fxRate, 10);
          if (!fxRate) throw new Error('Invalid FxRate');

          await tx.insert(journalEntryFxRates).values({
            journalEntryId: journalEntry.id,
            baseCurrencyId: debitAccount.currency.id,
            targetCurrencyId: formCurrency.id,
            rate: fxRate.toFixed(10),
          });
        }

        const debitTransaction: TransactionInsert = {
          journalEntryId: journalEntry.id,
          accountId: form.debitAccountId,
          amount: amount.toFixed(baseCurrency.isoDigits),
        };

        const creditTransaction: TransactionInsert = {
          journalEntryId: journalEntry.id,
          accountId: form.creditAccountId,
          amount: (amount * -1).toFixed(baseCurrency.isoDigits),
        };

        await Promise.all([
          tx.insert(transactions).values(type === 'income' ? creditTransaction : debitTransaction),
          tx.insert(transactions).values(type === 'income' ? debitTransaction : creditTransaction),
        ]);

        return journalEntry.id;
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return await this.getJournalEntryById(entryId ?? -1);
  }

  private async insertJournalEntry(
    tx: PgliteTransaction,
    currencyId: number,
    amount: number,
    { journalEntryType, date, time, title, description }: ExpenseTxForm,
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
}

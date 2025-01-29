import { parseNumber } from '@/components/common-functions';
import type { TransactionForm } from '@/components/compositions/manage-transactions/add-transaction-drawer/form-schema';
import * as schema from '@/db/drizzle/schema';
import type { JournalEntryType, PgliteTransaction, TransactionInsert } from '@/db/drizzle/types';
import type { PgliteDrizzle } from '@/db/pglite-web-worker';
import { DateTime } from 'luxon';
import { ConfigService } from './config-service';
import { Service } from './service-primitive';

export class TransactionService extends Service {
  private configService: ConfigService;

  constructor(drizzle: PgliteDrizzle) {
    super(drizzle);
    this.configService = new ConfigService(drizzle);
  }

  public async getIncomeSummary(from: Date, to: Date) {
    const incomeEntries = await this.getJournalEntries('income', { from, to });
    return incomeEntries.reduce((acc, cur) => acc + (parseNumber(cur.amount) ?? 0), 0);
  }

  public async getExpenseSummary(from: Date, to: Date) {
    const expenseEntries = await this.getJournalEntries('expense', { from, to });
    return expenseEntries.reduce((acc, cur) => acc + (parseNumber(cur.amount) ?? 0), 0);
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
    const entryId = await this.drizzle.transaction(async (tx) => {
      debugger;
      try {
        debugger;
        const journalEntry = await this.insertJournalEntry(tx, form);

        if (!journalEntry) {
          throw new Error('Insert to journal Entry failed');
        }

        const currency = await tx.query.currencies.findFirst({
          where: (currency, { eq }) => eq(currency.code, form.currencyCode),
        });

        if (!currency) {
          throw new Error('Failed to fetch currency');
        }

        const amount = parseNumber(form.amount);

        if (!amount) {
          throw new Error('Amount field cannot be null');
        }

        const debitTransaction: TransactionInsert = {
          journalEntryId: journalEntry?.id,
          accountId: form.debitAccountId,
          currencyId: currency.id,
          amount: (amount * -1).toString(10),
        };

        const creditTransaction: TransactionInsert = {
          journalEntryId: journalEntry?.id,
          accountId: form.creditAccountId,
          currencyId: currency.id,
          amount: amount.toString(10),
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
    await tx.insert(schema.transactions).values(data);
  }

  private async insertJournalEntry(
    tx: PgliteTransaction,
    { journalEntryType, date, time, title, description, currencyCode, amount }: TransactionForm,
  ) {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const datetime = DateTime.fromJSDate(date, { zone: systemTimezone });
    datetime.set({ hour: time.hour, minute: time.minute, second: 0, millisecond: 0 });

    const currency = await this.configService.getCurrencyByCode(currencyCode);

    return (
      await tx
        .insert(schema.journalEntries)
        .values({
          type: journalEntryType,
          date: datetime.toJSDate(),
          title,
          description,
          currencyId: currency?.id ?? -1,
          amount,
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
    });
  }
}

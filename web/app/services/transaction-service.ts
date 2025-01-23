import { parseNumber } from '@/components/common-functions';
import type { ExpenseTransactionForm } from '@/components/compositions/manage-transactions/add-transaction-drawer/expense-form';
import * as schema from '@/db/drizzle/schema';
import type { PgTransaction, TransactionInsert } from '@/db/drizzle/types';
import type { PgliteDrizzle } from '@/db/pglite-drizzle';
import { DateTime } from 'luxon';
import { Service } from './service-primitive';

export class TransactionService extends Service {
  constructor(drizzle: PgliteDrizzle) {
    super(drizzle);
  }

  public async getJournalEntryById(id: number) {
    return await this.drizzle.getDb().query.journalEntries.findFirst({
      where: (journalEntries, { eq }) => eq(journalEntries.id, id),
      with: {
        transactions: true,
      },
    });
  }

  public async insertExpenseTransaction(form: ExpenseTransactionForm) {
    const entryId = await this.drizzle.getDb().transaction(async (tx) => {
      try {
        const journalEntry = await this.insertJournalEntry(
          tx,
          form.date,
          form.time,
          form.title,
          form.description,
        );

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

  private async insertTransaction(tx: PgTransaction, data: TransactionInsert) {
    await tx.insert(schema.transactions).values(data);
  }

  private async insertJournalEntry(
    tx: PgTransaction,
    date: Date,
    time: ExpenseTransactionForm['time'],
    title: string,
    description: string,
  ) {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const datetime = DateTime.fromJSDate(date, { zone: systemTimezone });
    datetime.set({ hour: time.hour, minute: time.minute, second: 0, millisecond: 0 });
    return (
      await tx
        .insert(schema.journalEntries)
        .values({
          date: datetime.toJSDate(),
          title,
          description,
        })
        .returning()
    ).at(0);
  }
}

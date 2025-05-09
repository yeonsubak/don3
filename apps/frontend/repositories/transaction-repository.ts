import type {
  ExpenseTxForm,
  FundTransferTxForm,
  IncomeTxForm,
} from '@/components/page/transactions/add-drawer/forms/form-schema';
import { journalEntries, journalEntryFxRates, transactions } from '@/db/drizzle/schema';
import type {
  JournalEntryFxRatesInsert,
  JournalEntryType,
  TransactionInsert,
} from '@/db/drizzle/types';
import { and, between, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { Repository } from './abstract-repository';

export class TransactionRepository extends Repository {
  public async getJournalEntryById(id: number) {
    return await this.db.query.journalEntries.findFirst({
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

  public async getJournalEntries(
    entryType: JournalEntryType[],
    { from, to }: { from: Date; to: Date },
    includeTx: boolean = false,
  ) {
    if (!from || !to) throw new Error('Invalid date range');

    return await this.db.query.journalEntries.findMany({
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

  public async insertJournalEntry(
    currencyId: number,
    amount: number,
    form: IncomeTxForm | ExpenseTxForm | FundTransferTxForm,
  ) {
    const { journalEntryType, date, time, title, description } = form;
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const datetime = DateTime.fromJSDate(date, { zone: systemTimezone });
    datetime.set({ hour: time.hour, minute: time.minute, second: 0, millisecond: 0 });
    return (
      await this.db
        .insert(journalEntries)
        .values({
          type: journalEntryType,
          date: datetime.toJSDate(),
          title,
          description,
          currencyId,
          amount: amount,
        })
        .returning()
    ).at(0);
  }

  public async insertJournalEntryFxRate(insert: JournalEntryFxRatesInsert) {
    return await this.db.insert(journalEntryFxRates).values(insert);
  }

  public async insertTransaction(insertObj: TransactionInsert) {
    await this.db.insert(transactions).values(insertObj);
  }
}

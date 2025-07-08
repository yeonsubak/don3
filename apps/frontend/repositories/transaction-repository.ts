import type {
  AppSchema,
  JournalEntryFxRatesInsert,
  JournalEntryInsert,
  JournalEntryType,
  TransactionInsert,
} from '@/db/app-db/drizzle-types';
import { journalEntries, journalEntryFxRates, transactions } from '@/db/app-db/schema';
import { and, between, eq, inArray } from 'drizzle-orm';
import type { DateRange } from 'react-day-picker';
import { Repository } from './abstract-repository';
import { writeOpLog } from './repository-decorators';

export class TransactionRepository extends Repository<AppSchema> {
  public async getJournalEntryById(id: string) {
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
    { from, to }: DateRange,
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

  @writeOpLog('getJournalEntries', 'getSummary')
  public insertJournalEntry(data: JournalEntryInsert) {
    return this.db
      .insert(journalEntries)
      .values({ id: crypto.randomUUID(), ...data })
      .returning();
  }

  @writeOpLog('getJournalEntries', 'getSummary')
  public updateJournalEntry(data: JournalEntryInsert) {
    return this.db
      .update(journalEntries)
      .set({ ...data, id: undefined, updateAt: new Date() })
      .where(eq(journalEntries.id, data.id!))
      .returning();
  }

  @writeOpLog('getJournalEntries', 'getSummary')
  public deleteJournalEntries(journalEntryId: string | string[]) {
    if (Array.isArray(journalEntryId)) {
      return this.db
        .delete(journalEntries)
        .where(inArray(journalEntries.id, journalEntryId))
        .returning();
    }

    return this.db.delete(journalEntries).where(eq(journalEntries.id, journalEntryId)).returning();
  }

  @writeOpLog()
  public insertJournalEntryFxRate(data: JournalEntryFxRatesInsert) {
    return this.db
      .insert(journalEntryFxRates)
      .values({ id: crypto.randomUUID(), ...data })
      .returning();
  }

  @writeOpLog()
  public updateJournalEntryFxRate(data: JournalEntryFxRatesInsert) {
    return this.db
      .update(journalEntryFxRates)
      .set({ ...data, id: undefined, updateAt: new Date() })
      .where(eq(journalEntryFxRates.id, data.id!))
      .returning();
  }

  @writeOpLog('getJournalEntries', 'getSummary')
  public insertTransaction(data: TransactionInsert) {
    return this.db
      .insert(transactions)
      .values({ id: crypto.randomUUID(), ...data })
      .returning();
  }

  @writeOpLog('getJournalEntries', 'getSummary')
  public updateTransaction(data: TransactionInsert) {
    return this.db
      .update(transactions)
      .set({ ...data, id: undefined, updateAt: new Date() })
      .where(eq(transactions.id, data.id!))
      .returning();
  }
}

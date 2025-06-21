import { journalEntries, journalEntryFxRates, transactions } from '@/db/drizzle/schema';
import type {
  JournalEntryFxRatesInsert,
  JournalEntryInsert,
  JournalEntryType,
  TransactionInsert,
} from '@/db/drizzle/types';
import { and, between, eq, inArray } from 'drizzle-orm';
import type { DateRange } from 'react-day-picker';
import { Repository } from './abstract-repository';
import { writeOperationLog } from './repository-decorators';

export class TransactionRepository extends Repository {
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

  @writeOperationLog
  public async insertJournalEntry(insert: JournalEntryInsert) {
    return (await this.db.insert(journalEntries).values(insert).returning()).at(0);
  }

  @writeOperationLog
  public async updateJournalEntry(updateObj: JournalEntryInsert) {
    return (
      await this.db
        .update(journalEntries)
        .set({ ...updateObj, id: undefined, updateAt: new Date() })
        .where(eq(journalEntries.id, updateObj.id!))
        .returning()
    ).at(0);
  }

  @writeOperationLog
  public async deleteJournalEntries(journalEntryId: string | string[]) {
    if (Array.isArray(journalEntryId)) {
      return await this.db
        .delete(journalEntries)
        .where(inArray(journalEntries.id, journalEntryId))
        .returning();
    }

    return (
      await this.db.delete(journalEntries).where(eq(journalEntries.id, journalEntryId)).returning()
    ).at(0);
  }

  @writeOperationLog
  public async insertJournalEntryFxRate(insert: JournalEntryFxRatesInsert) {
    return (await this.db.insert(journalEntryFxRates).values(insert).returning()).at(0);
  }

  @writeOperationLog
  public async updateJournalEntryFxRate(updateObj: JournalEntryFxRatesInsert) {
    return (
      await this.db
        .update(journalEntryFxRates)
        .set({ ...updateObj, id: undefined, updateAt: new Date() })
        .where(eq(journalEntryFxRates.id, updateObj.id!))
        .returning()
    ).at(0);
  }

  @writeOperationLog
  public async insertTransaction(insertObj: TransactionInsert) {
    return (await this.db.insert(transactions).values(insertObj).returning()).at(0);
  }

  @writeOperationLog
  public async updateTransaction(updateObj: TransactionInsert) {
    return (
      await this.db
        .update(transactions)
        .set({ ...updateObj, id: undefined, updateAt: new Date() })
        .where(eq(transactions.id, updateObj.id!))
        .returning()
    ).at(0);
  }
}

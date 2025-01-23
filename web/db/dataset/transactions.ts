// import * as schema from '../drizzle/schema';
// import type { JournalEntryInsert, TransactionInsert } from '../drizzle/types';
// import { PgliteDrizzle } from '../pglite-drizzle';

// type InsertFn = {
//   journalEntry: JournalEntryInsert;
//   transactions: Omit<TransactionInsert, 'journalEntryId'>[];
// };

// export const DATASET_TRANSACTIONS: () => Promise<void> = async () => {
//   const drizzle = await PgliteDrizzle.getInstance();
//   const insertFn = async ({ journalEntry, transactions }: InsertFn) => {
//     const entry = (
//       await drizzle.getDb().insert(schema.journalEntries).values(journalEntry).returning()
//     ).at(0);
//     const transactionInserts = transactions.map((e) => ({ ...e, journalEntryId: entry?.id ?? -1 }));
//     await drizzle.getDb().insert(schema.transactions).values(transactionInserts);
//   };

//   return [
//     insertFn({
//       journalEntry: {
//         title: '무제1',
//         date: new Date(),
//       },
//       transactions: [{}],
//     }),
//     insertFn({}),
//   ];
// };

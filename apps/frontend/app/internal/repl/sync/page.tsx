'use client';

import { PGliteSync } from '@/db/pglite/pglite-sync';
import { Repl } from '@electric-sql/pglite-repl';

export default function ReplPage() {
  const pg = PGliteSync.getInstance();

  return <Repl pg={pg} />;
}

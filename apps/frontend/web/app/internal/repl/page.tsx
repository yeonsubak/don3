'use client';

import { PgliteClient } from '@/db/pglite-client';
import { Repl } from '@electric-sql/pglite-repl';

export default function ReplPage() {
  const pg = PgliteClient.getInstance()!;

  return (
    <>
      <Repl pg={pg} />
    </>
  );
}

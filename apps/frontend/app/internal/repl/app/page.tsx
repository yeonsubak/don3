'use client';

import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import { Repl } from '@electric-sql/pglite-repl';
import { useEffect, useState } from 'react';

export default function ReplPage() {
  const [pg, setPg] = useState<PGliteAppWorker | undefined>(undefined);

  useEffect(() => {
    async function init() {
      const pgWorker = await PGliteAppWorker.getInstance();
      setPg(pgWorker);
    }

    init();
  }, []);

  if (pg) {
    return <Repl pg={pg} />;
  }
}

'use client';

import { indexedDb, initializeIndexedDb } from '@/db/drizzle';
import type { DrizzleClient } from '@/db/drizzle/types';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type Db = { drizzle: DrizzleClient; isReady: boolean };

type DbContext = {
  db: Db | null;
  setDb: Dispatch<SetStateAction<Db>>;
};

export const DbContext = createContext<DbContext | null>(null);

export function DbContextProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>({ drizzle: undefined, isReady: false });

  useEffect(() => {
    initializeIndexedDb();
    setDb({ drizzle: indexedDb, isReady: true });
  }, []);

  return <DbContext.Provider value={{ db, setDb }}>{children}</DbContext.Provider>;
}

export function useDbContext() {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error('useDbContext must be used within a DbContextProvider');
  }

  return context;
}

export default DbContextProvider;

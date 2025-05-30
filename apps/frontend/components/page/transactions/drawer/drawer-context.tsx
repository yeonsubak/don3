'use client';

import type { JournalEntryType } from '@/db/drizzle/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { z } from 'zod';
import type { baseTxForm } from './forms/form-schema';
import type { TransactionItem } from '../transaction-record';

type SharedForm = Partial<z.infer<typeof baseTxForm>> & {
  debitAccountId?: string;
  creditAccountId?: string;
  countryCode?: string;
};

type DrawerMode = 'add' | 'edit' | 'delete';

type TransactionDrawerContext = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  sharedFormRef: RefObject<SharedForm | undefined>;
  setSharedFormRef: (form: SharedForm | undefined) => void;
  selectedTab: JournalEntryType;
  setSelectedTab: Dispatch<SetStateAction<JournalEntryType>>;
  mode: DrawerMode;
  setMode: Dispatch<SetStateAction<DrawerMode>>;
  isProcessing: boolean;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  record: TransactionItem | undefined;
  setRecord: Dispatch<SetStateAction<TransactionItem | undefined>>;
};

const TransactionDrawerContext = createContext<TransactionDrawerContext | null>(null);

export const TransactionDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  const [selectedTab, setSelectedTab] = useState<JournalEntryType>('expense');

  const [mode, setMode] = useState<DrawerMode>('add');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const sharedFormRef = useRef<SharedForm | undefined>(undefined);
  const setSharedFormRef = useCallback((form: SharedForm | undefined) => {
    sharedFormRef.current = form;
  }, []);

  const [record, setRecord] = useState<TransactionItem | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setSharedFormRef(undefined);
      setRecord(undefined);
      setMode('add');
    }
  }, [open, setSharedFormRef]);

  return (
    <TransactionDrawerContext.Provider
      value={{
        open,
        setOpen,
        sharedFormRef,
        setSharedFormRef,
        selectedTab,
        setSelectedTab,
        mode,
        setMode,
        isProcessing,
        setIsProcessing,
        record,
        setRecord,
      }}
    >
      {children}
    </TransactionDrawerContext.Provider>
  );
};

export const useTransactionDrawerContext = () => {
  const context = useContext(TransactionDrawerContext);
  if (!context) {
    throw new Error(
      'useTransactionDrawerContext must be used within a TransactionDrawerContextProvider',
    );
  }
  return context;
};

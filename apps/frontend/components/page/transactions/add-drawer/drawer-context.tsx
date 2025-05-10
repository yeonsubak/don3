'use client';

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

type SharedForm = Partial<z.infer<typeof baseTxForm>> & {
  debitAccountId?: number;
  creditAccountId?: number;
  countryCode?: string;
};

export type TransactionDrawerContext = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  sharedFormRef: RefObject<SharedForm | undefined>;
  setSharedFormRef: (form: SharedForm | undefined) => void;
};
export const TransactionDrawerContext = createContext<TransactionDrawerContext | null>(null);

export const TransactionDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const sharedFormRef = useRef<SharedForm | undefined>(undefined);

  const setSharedFormRef = useCallback((form: SharedForm | undefined) => {
    sharedFormRef.current = form;
  }, []);

  useEffect(() => {
    if (!open) {
      setSharedFormRef(undefined);
    }
  }, [open, setSharedFormRef]);

  return (
    <TransactionDrawerContext.Provider
      value={{
        open,
        setOpen,
        sharedFormRef,
        setSharedFormRef,
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

'use client';

import type { AccountGroupType } from '@/db/drizzle/types';
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { type AccountForm } from '../form-schema';

export type AccountDrawerContextProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  selectedTab: AccountGroupType;
  setSelectedTab: Dispatch<SetStateAction<AccountGroupType>>;
  formValues: Partial<AccountForm> | undefined;
  setFormValues: Dispatch<SetStateAction<Partial<AccountForm> | undefined>>;
  mode: 'add' | 'edit';
  setMode: Dispatch<SetStateAction<'add' | 'edit'>>;
};
export const AccountDrawerContext = createContext<AccountDrawerContextProps | null>(null);

export const AccountDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<AccountGroupType>('asset');
  const [formValues, setFormValues] = useState<Partial<AccountForm> | undefined>(undefined);
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  return (
    <AccountDrawerContext.Provider
      value={{
        open,
        setOpen,
        selectedTab,
        setSelectedTab,
        formValues,
        setFormValues,
        mode,
        setMode,
      }}
    >
      {children}
    </AccountDrawerContext.Provider>
  );
};

export const useAccountDrawerContext = () => {
  const context = useContext(AccountDrawerContext);
  if (!context) {
    throw new Error('useAccountDrawerContext must be used within a AccountDrawerContextProvider');
  }
  return context;
};

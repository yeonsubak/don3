'use client';

import type { AccountGroupType, AccountSelect } from '@/db/drizzle/types';
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { AccountFormSchema } from './account-form-schema';

type DrawerMode = 'add' | 'edit' | 'archive' | 'reactivate' | 'delete';

type AccountDrawerContextProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  mode: DrawerMode;
  setMode: Dispatch<SetStateAction<DrawerMode>>;
  selectedTab: AccountGroupType;
  setSelectedTab: Dispatch<SetStateAction<AccountGroupType>>;

  formValues: Partial<AccountFormSchema> | undefined;
  setFormValues: Dispatch<SetStateAction<Partial<AccountFormSchema> | undefined>>;

  account: AccountSelect | undefined;
  setAccount: Dispatch<SetStateAction<AccountSelect | undefined>>;
};

const AccountDrawerContext = createContext<AccountDrawerContextProps | null>(null);

export const AccountDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>('add');
  const [selectedTab, setSelectedTab] = useState<AccountGroupType>('asset');

  const [formValues, setFormValues] = useState<Partial<AccountFormSchema> | undefined>(undefined);

  const [account, setAccount] = useState<AccountSelect | undefined>(undefined);

  return (
    <AccountDrawerContext.Provider
      value={{
        open,
        setOpen,
        mode,
        setMode,
        selectedTab,
        setSelectedTab,

        formValues,
        setFormValues,

        account,
        setAccount,
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

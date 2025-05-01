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

export type AccountDrawerContextProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  groupType: AccountGroupType;
  setGroupType: Dispatch<SetStateAction<AccountGroupType>>;
  countryCode: string;
  setCountryCode: Dispatch<SetStateAction<string>>;
};
export const AccountDrawerContext = createContext<AccountDrawerContextProps | null>(null);

export const AccountDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [groupType, setGroupType] = useState<AccountGroupType>('asset');
  const [countryCode, setCountryCode] = useState<string>('');

  return (
    <AccountDrawerContext.Provider
      value={{
        open,
        setOpen,
        groupType,
        setGroupType,
        countryCode,
        setCountryCode,
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

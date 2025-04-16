'use client';

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
};
export const AccountDrawerContext = createContext<AccountDrawerContextProps | null>(null);

export const AccountDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <AccountDrawerContext.Provider
      value={{
        open,
        setOpen,
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

'use client';

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type SettingsDrawerMode = 'sync' | 'backup' | 'restore';

type SettingsDrawerContextProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  mode: SettingsDrawerMode;
  setMode: Dispatch<SetStateAction<SettingsDrawerMode>>;
  isProcessing: boolean;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
};

const SettingsDrawerContext = createContext<SettingsDrawerContextProps | null>(null);

export const SettingsDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SettingsDrawerMode>('sync');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname();

  const onClose = useCallback(() => {
    if (open) {
      setOpen(false);
    }

    setMode('sync');
    setIsProcessing(false);
    router.push(pathname);
  }, [open, pathname, router]);

  return (
    <SettingsDrawerContext.Provider
      value={{
        open,
        setOpen,
        mode,
        setMode,
        isProcessing,
        setIsProcessing,
        onClose,
      }}
    >
      {children}
    </SettingsDrawerContext.Provider>
  );
};

export const useSettingsDrawerContext = () => {
  const context = useContext(SettingsDrawerContext);
  if (!context) {
    throw new Error('useSettingsDrawerContext must be used within a SettingsDrawerContextProvider');
  }
  return context;
};

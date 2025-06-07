'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type DrawerMode = 'sync' | 'backup' | 'restore';

type SettingsDrawerContextProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  mode: DrawerMode;
  setMode: Dispatch<SetStateAction<DrawerMode>>;
  isProcessing: boolean;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  onClose: () => void;
};

const SettingsDrawerContext = createContext<SettingsDrawerContextProps | null>(null);

export const SettingsDrawerContextProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>('sync');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onClose = useCallback(() => {
    setMode('sync');
    setOpen(false);
    setIsProcessing(false);
  }, []);

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

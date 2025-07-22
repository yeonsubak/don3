import { AccountDrawerContextProvider } from '@/app/app/accounts/account-drawer-context';
import { AccountsContextProvider } from '@/app/app/accounts/accounts-context';
import { GlobalContextProvider } from '@/app/app/global-context';
import { TransactionFormTab } from '@/app/app/transactions/components/drawer/transaction-form-tab';
import { TransactionContextProvider } from '@/app/app/transactions/transaction-context';
import { TransactionDrawerContextProvider } from '@/app/app/transactions/transaction-drawer-context';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getBackupService, getSyncService } from '@/services/service-helpers';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState, type RefObject } from 'react';
import { AccountsOverview } from '../../accounts/components/accounts-overview';
import { type StepProps } from '../step';
import { StepDialog } from '../step-dialog';
import { CompletionStep } from './steps/completion-step';
import { DefaultValueStep } from './steps/default-value-step';

const Completion = () => {
  const [status, setStatus] = useState<'inProcess' | 'done'>('inProcess');

  const effectFn = useCallback(() => {
    async function finalize() {
      const isInitialized = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.INITIALIZED) === 'true';
      const isSyncEnable = localStorage.getItem(LOCAL_STORAGE_KEYS.SYNC.SYNC_ENABLED) === 'true';

      if (isInitialized) {
        setStatus('done');
        return;
      }

      if (isSyncEnable) {
        const backupService = await getBackupService();
        const syncService = await getSyncService();

        const { dump, metaData } = await backupService.createBackup();
        const insertSnapshotResult = await syncService.insertSnapshot({
          type: 'autosave',
          meta: metaData,
          dump,
          status: 'idle',
        });
        setStatus('done');
      }
    }

    finalize();
  }, []);

  return <CompletionStep status={status} syncFn={effectFn} syncFnDeps={[]} />;
};

function steps(
  currentStep: number,
  defaultValueStepRef: RefObject<{
    submitForm: () => Promise<void>;
  } | null>,
): StepProps[] {
  return [
    {
      order: 1,
      title: 'Default country & currency',
      description: 'Please select the default country and currency for the initial setup.',
      Component: <DefaultValueStep ref={currentStep === 0 ? defaultValueStepRef : null} />,
      onNext: async () => {
        await defaultValueStepRef.current?.submitForm();
      },
    },
    {
      order: 2,
      title: 'Add accounts',
      description: 'Please add accounts that track your incomes and expenses.',
      Component: () => {
        const queryClient = useQueryClient();

        return (
          <QueryClientProvider client={queryClient}>
            <GlobalContextProvider>
              <AccountsContextProvider>
                <AccountDrawerContextProvider>
                  <AccountsOverview className="h-[56vh]" />
                </AccountDrawerContextProvider>
              </AccountsContextProvider>
            </GlobalContextProvider>
          </QueryClientProvider>
        );
      },
    },
    {
      order: 3,
      title: 'Add your first record',
      description:
        'You can easily add a record of your incomes and expenses by filling out the below fields.',
      Component: () => {
        const queryClient = useQueryClient();

        return (
          <QueryClientProvider client={queryClient}>
            <GlobalContextProvider>
              <TransactionContextProvider>
                <TransactionDrawerContextProvider>
                  <TransactionFormTab />
                </TransactionDrawerContextProvider>
              </TransactionContextProvider>
            </GlobalContextProvider>
          </QueryClientProvider>
        );
      },
    },
    {
      order: 4,
      title: 'All done!',
      description: 'You are ready to start using the application.',
      Component: <Completion />,
    },
  ];
}

export const GettingStartedDialog = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const defaultValueStepRef = useRef<{ submitForm: () => Promise<void> }>(null);

  return (
    <StepDialog
      steps={steps(currentStep, defaultValueStepRef)}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      dialogContentProps={{ className: 'min-h-[600px]' }}
      stepClassName="min-h-[350px]"
    />
  );
};

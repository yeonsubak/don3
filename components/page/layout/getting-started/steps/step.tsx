import { AccountsContextProvider } from '@/app/app/accounts/accounts-context';
import { GlobalContextProvider } from '@/app/app/global-context';
import { AccountDrawerContextProvider } from '@/components/page/accounts/drawer/drawer-context';
import { TransactionDrawerContextProvider } from '@/components/page/transactions/drawer/drawer-context';
import { TransactionContextProvider } from '@/components/page/transactions/transaction-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

type Ref = {
  submitForm: () => Promise<void>;
};

export type StepProps = {
  order: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onNext?: (ref: Ref | undefined | null) => Promise<void>;
  onBack?: () => Promise<void>;
};

const StepElement = ({ title, description, children }: StepProps) => {
  return (
    <div className="flex grow flex-col space-y-2 py-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export const Step = ({ ...props }: StepProps) => {
  const queryClient = new QueryClient();

  if (props.order === 2) {
    return (
      <QueryClientProvider client={queryClient}>
        <GlobalContextProvider>
          <AccountsContextProvider>
            <AccountDrawerContextProvider>
              <StepElement {...props} />
            </AccountDrawerContextProvider>
          </AccountsContextProvider>
        </GlobalContextProvider>
      </QueryClientProvider>
    );
  }

  if (props.order === 3) {
    return (
      <QueryClientProvider client={queryClient}>
        <GlobalContextProvider>
          <TransactionContextProvider>
            <TransactionDrawerContextProvider>
              <StepElement {...props} />
            </TransactionDrawerContextProvider>
          </TransactionContextProvider>
        </GlobalContextProvider>
      </QueryClientProvider>
    );
  }

  return <StepElement {...props} />;
};

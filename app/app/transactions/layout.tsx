'use client';

import { TransactionDrawerContextProvider } from '@/components/page/transactions/drawer/drawer-context';
import { TransactionContextProvider } from '@/components/page/transactions/transaction-context';

export default function TransactionPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <TransactionContextProvider>
      <TransactionDrawerContextProvider>{children}</TransactionDrawerContextProvider>
    </TransactionContextProvider>
  );
}

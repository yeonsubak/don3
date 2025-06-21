'use client';

import { TransactionDrawerContextProvider } from './transaction-drawer-context';
import { TransactionContextProvider } from './transaction-context';

export default function TransactionPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <TransactionContextProvider>
      <TransactionDrawerContextProvider>{children}</TransactionDrawerContextProvider>
    </TransactionContextProvider>
  );
}

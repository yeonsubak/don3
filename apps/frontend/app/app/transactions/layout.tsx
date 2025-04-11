'use client';

import { TransactionContextProvider } from '@/components/page/transactions/transaction-context';

export default function TransactionPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <TransactionContextProvider>{children}</TransactionContextProvider>;
}

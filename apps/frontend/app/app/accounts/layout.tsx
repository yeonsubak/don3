'use client';
import { AccountDrawerContextProvider } from '@/components/page/accounts/drawer/drawer-context';
import { AccountsContextProvider } from './accounts-context';

export default function TransactionPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AccountsContextProvider>
      <AccountDrawerContextProvider>{children}</AccountDrawerContextProvider>
    </AccountsContextProvider>
  );
}

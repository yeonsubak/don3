'use client';
import { AccountDrawerContextProvider } from '@/app/app/accounts/account-drawer-context';
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

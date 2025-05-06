'use client';

import { AppSidebar } from '@/components/compositions/app-sidebar';
import { Breadcrumb } from '@/components/compositions/breadcrumb';
import { GettingStartedForm } from '@/components/page/layout/getting-started/getting-started-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { GlobalContextProvider } from './global-context';

const queryClient = new QueryClient();

export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <SideBar>
      <ValidateDefault>
        <QueryClientProvider client={queryClient}>
          <GlobalContextProvider>{children}</GlobalContextProvider>
        </QueryClientProvider>
      </ValidateDefault>
    </SideBar>
  );
}

function SideBar({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb pathname={pathname} />
        </header>
        <main className="h-full w-full px-6 py-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ValidateDefault({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState<boolean>(true);

  // Disable rendering on server side
  if (typeof window === 'undefined') {
    return null;
  }

  const defaultCountry = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY);
  const defaultCurrency = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY);

  if (!defaultCountry || !defaultCurrency) {
    return (
      <Dialog open={open}>
        <DialogContent disableClose>
          <DialogHeader>
            <DialogTitle>Getting started</DialogTitle>
            <DialogDescription>
              Please select the default country and currency for the initial setup.
            </DialogDescription>
            <GettingStartedForm posthook={() => setOpen(false)} />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}

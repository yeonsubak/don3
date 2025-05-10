'use client';

import { AppSidebar } from '@/components/compositions/app-sidebar';
import { Breadcrumb } from '@/components/compositions/breadcrumb';
import { DarkModeToggle } from '@/components/compositions/dark-mode-toggle';
import { GettingStartedDialog } from '@/components/page/layout/getting-started/getting-started-dialog';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
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
          <DarkModeToggle className="ml-auto" />
        </header>
        <main className="h-full w-full px-6 py-4">{children}</main>
        <Toaster expand={true} />
      </SidebarInset>
    </SidebarProvider>
  );
}

function ValidateDefault({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GettingStartedDialog>{children}</GettingStartedDialog>;
}

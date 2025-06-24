'use client';

import { GettingStartedDialog } from '@/app/app/getting-started/getting-started-dialog';
import { AppSidebar } from '@/components/compositions/app-sidebar';
import { Breadcrumb } from '@/components/compositions/breadcrumb';
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
      <QueryClientProvider client={queryClient}>
        <ValidateDefault>
          <GlobalContextProvider>{children}</GlobalContextProvider>
        </ValidateDefault>
      </QueryClientProvider>
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
          <Breadcrumb pathname={pathname} className="text-lg" />
          {/* <DarkModeToggle className="ml-auto" /> */}
        </header>
        <main className="h-full w-full p-4">{children}</main>
        <Toaster className="z-99999 text-pretty" expand={true} richColors />
      </SidebarInset>
    </SidebarProvider>
  );
}

function ValidateDefault({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GettingStartedDialog>{children}</GettingStartedDialog>;
}

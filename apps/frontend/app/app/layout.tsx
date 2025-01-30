'use client';

import { AppSidebar } from '@/components/compositions/app-sidebar';
import { Breadcrumb } from '@/components/compositions/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { GlobalContextProvider } from './global-context';

const queryClient = new QueryClient();

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent>{children}</AppContent>
    </QueryClientProvider>
  );
}

function AppContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <GlobalContextProvider>
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
    </GlobalContextProvider>
  );
}

import DbContextProvider from '../db-context';

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DbContextProvider>{children}</DbContextProvider>;
}

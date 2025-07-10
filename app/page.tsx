'use client'; // TODO: Remove when the landing page is available

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  // TODO: Remove redirection when the landing page is available
  useEffect(() => {
    router.push('/app');
  }, [router]);

  return <></>;
}

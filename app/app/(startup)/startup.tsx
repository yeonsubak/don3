'use client';

import { GoogleSignInButton } from '@/components/buttons/google-sign-in-button';
import { useIsInit } from '@/components/hooks/use-is-init';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from '@/lib/better-auth/auth-client';
import { QUERIES } from '@/lib/tanstack-queries';
import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { GettingStartedDialog } from './getting-started/getting-started-dialog';
import { SyncDialog } from './sync/sync-dialog';

const WelcomeDialog = () => {
  const [open, setOpen] = useState<boolean>(true);
  const router = useRouter();
  const currentPath = usePathname();
  const searchParams = useSearchParams();
  const syncParam = searchParams.get('syncSignIn');

  const isSync = syncParam === 'true' ? true : syncParam === 'false' ? false : null;

  const session = useSession();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const { data: hasSyncServer, isPending } = useQuery(QUERIES.sync.hasSyncServer());

  useEffect(() => {
    if (isSync === null && !session.isExpired) {
      // Show sync dialog
      const params = new URLSearchParams();
      params.set('syncSignIn', 'true');
      router.push(`?${params.toString()}`);
    }
  }, [isSync, router, session.isExpired]);

  if (isSync) {
    return <SyncDialog session={session} />;
  }

  if (isSync === false) {
    return <GettingStartedDialog />;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-fit flex-col sm:max-w-[500px]" disableClose>
        <DialogHeader>
          <DialogTitle className="mb-2 text-center text-xl">Welcome to Don³</DialogTitle>
          <div className="text-foreground flex flex-col gap-2">
            <p>{`Don³ helps you track your income and expenses, manage categories, and keep your budget organized.`}</p>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-4 sm:flex-col sm:justify-normal">
          {!isPending && (
            <>
              {hasSyncServer && (
                <div className="flex flex-col gap-1">
                  <GoogleSignInButton
                    className="text-base"
                    callbackPath={`${currentPath}?syncSignIn=true`}
                    session={session}
                  />
                  <p className="text-muted-foreground px-2 text-sm">{`⚠️ Sign up is optional and only required for syncing your data across devices. You can use the app fully without an account.`}</p>
                </div>
              )}
              <Button
                className="text-base"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('syncSignIn', 'false');
                  router.push(`?${params.toString()}`);
                }}
              >
                {hasSyncServer ? 'Use Without Sign-In' : 'Continue'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const StartUp = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { isInit } = useIsInit();

  if (!isInit) {
    return <WelcomeDialog />;
  }

  return children;
};

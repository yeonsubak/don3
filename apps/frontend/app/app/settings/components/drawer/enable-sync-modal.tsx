import { GoogleSignInButton } from '@/components/buttons/google-sign-in-button';
import { PasskeyActivateButton } from '@/components/buttons/passkey-activate-button';
import { useSession } from '@/lib/better-auth/auth-client';
import { APP_DB_NAME } from '@/lib/constants';
import { getBackupService } from '@/services/service-helpers';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';

export const EnableSyncModal = () => {
  // const { setIsProcessing, onClose } = useSettingsDrawerContext();
  const session = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  async function syncPostHook() {
    const backupService = await getBackupService();
    const { status, meta } = await backupService.migrateDB(APP_DB_NAME(session.user?.id));
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Step 1: Sign in</h2>
          <p>Click the button below to sign in to the app.</p>
          <GoogleSignInButton
            session={session}
            callbackPath={`${pathname}/?drawerMode=sync&isOpen=true`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Step 2: Authenticate via Passkey</h2>
          <p>
            {
              "Once you tap the button below, the Passkey prompt will appear. Follow the instructions to create a Passkey if you don't have one, or complete authentication using your existing Passkey."
            }
          </p>
          <PasskeyActivateButton
            session={session}
            queryClient={queryClient}
            postHook={syncPostHook}
          />
        </div>
      </div>
    </>
  );
};

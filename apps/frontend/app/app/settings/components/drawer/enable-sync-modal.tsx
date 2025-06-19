import { GoogleSignInButton } from '@/components/buttons/google-sign-in-button';
import { signInWithGoogle, useSession, type Session } from '@/lib/better-auth/auth-client';
import { QUERIES } from '@/lib/tanstack-queries';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSettingsDrawerContext } from '../../settings-drawer-context';
import { PasskeyActivateButton } from './passkey-manager';

const SignInButton = ({ session, isPending }: Session) => {
  const { data: username } = useQuery({
    enabled: !!session?.user.email,
    ...QUERIES.sync.refreshUsername(session?.user.email),
  });

  const label = useMemo(() => {
    if (isPending) return 'Checking sign-in status...';
    if (session) return `Signed in as ${session?.user.email}`;
    return undefined;
  }, [isPending, session]);

  return (
    <GoogleSignInButton
      label={label}
      disabled={isPending || !!session}
      onClick={!isPending && !session ? signInWithGoogle : undefined}
    />
  );
};

export const EnableSyncModal = () => {
  const { setIsProcessing, onClose } = useSettingsDrawerContext();
  const session = useSession();
  const { data: fetchedPasskeys, isPending } = useQuery({
    enabled: !session.isPending && !!session.session,
    ...QUERIES.sync.listPasskeys(),
  });
  const hasPasskey = useMemo(
    () => (fetchedPasskeys?.data?.length ?? 0) > 0,
    [fetchedPasskeys?.data?.length],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Step 1: Sign in</h2>
        <p>Click the button below to sign in to the app.</p>
        <SignInButton {...session} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Step 2: Authenticate via Passkey</h2>
        <p>
          {
            'Once you tap the button below, the Passkey prompt will appear. Follow the instructions to create a Passkey if you don’t have one, or complete authentication using your existing Passkey.'
          }
        </p>
        <PasskeyActivateButton hasPasskey={hasPasskey} isPendingPasskey={isPending} />
      </div>
    </div>
  );
};

import { useLocalStorage } from '@/components/hooks/use-local-storage';
import { passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { DateTime } from 'luxon';
import { LOCAL_STORAGE_KEYS } from '../constants';

export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});

function isSessionExpired(data: _Session | null) {
  if (data && data.session && data.user) {
    const expireAt = DateTime.fromJSDate(data.session.expiresAt);
    const now = DateTime.now();
    if (now < expireAt) {
      return false;
    }
  }

  return true;
}

export async function getSession() {
  const { data, ...rest } = await authClient.getSession();
  return {
    session: data?.session,
    user: data?.user,
    isExpired: isSessionExpired(data),
    ...rest,
  };
}

export function useSession() {
  const { data, ...rest } = authClient.useSession();
  const [isSyncEnable] = useLocalStorage<boolean>(LOCAL_STORAGE_KEYS.SYNC.SYNC_ENABLED, false);
  const [userId, setUserId] = useLocalStorage<string>(LOCAL_STORAGE_KEYS.SYNC.USER_ID, '');

  if (isSyncEnable && data?.user.id && data?.user.id !== userId) {
    setUserId(data?.user.id);
  }

  return {
    session: data?.session,
    user: data?.user,
    isExpired: isSessionExpired(data),
    ...rest,
  };
}

export async function signInWithGoogle(callbackPath: string) {
  return await authClient.signIn.social({
    provider: 'google',
    callbackURL: callbackPath,
  });
}

export async function addPasskey() {
  return new Promise<Passkey>((resolve, reject) => {
    authClient.passkey
      .addPasskey({
        authenticatorAttachment: 'cross-platform',
        fetchOptions: {
          onSuccess: async (ctx) => {
            resolve(ctx.data);
          },
          onError: reject,
        },
      })
      .catch(reject);
  });
}
type _Session = typeof authClient.$Infer.Session;
export type Session = ReturnType<typeof useSession>;
export type Passkey = typeof authClient.$Infer.Passkey;

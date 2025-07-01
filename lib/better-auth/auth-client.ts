import { passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { useLocalStorage } from 'usehooks-ts';
import { LOCAL_STORAGE_KEYS } from '../constants';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [passkeyClient()],
});

export function useSession() {
  const { data, ...rest } = authClient.useSession();
  const [userId, setUserId] = useLocalStorage(LOCAL_STORAGE_KEYS.APP.USER_ID, '', {
    serializer: (value) => value,
    deserializer: (value) => value,
  });

  if (data?.user.id && data?.user.id !== userId) {
    setUserId(data?.user.id);
  }

  return {
    session: data?.session,
    user: data?.user,
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

export type Session = ReturnType<typeof useSession>;
export type Passkey = typeof authClient.$Infer.Passkey;

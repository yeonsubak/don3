import { passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [passkeyClient()],
});

export function useSession() {
  const { data, ...rest } = authClient.useSession();
  return {
    session: data,
    ...rest,
  };
}

export async function signInWithGoogle() {
  return await authClient.signIn.social({
    provider: 'google',
    callbackURL: 'http://localhost:3000/app/settings?drawerMode=sync&isOpen=true',
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

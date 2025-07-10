'use server';

import { auth } from '@/lib/better-auth/auth';

export const generatePasskeyAuthenticationOptions = async () => {
  return await auth.api.generatePasskeyAuthenticationOptions();
};

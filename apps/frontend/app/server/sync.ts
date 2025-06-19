'use server';

import { externalDB } from '@/db/external-db/drizzle-client';
import { wrappedKeys } from '@/db/external-db/migration/schema';

export async function insertWrappedKey(passkeyId: string, wrappedKey: string, prfSalt: string) {
  return (
    await externalDB
      ?.insert(wrappedKeys)
      .values({
        id: crypto.randomUUID(),
        algorithm: 'AES-KW',
        passkeyId,
        wrappedKey,
        prfSalt,
      })
      .returning()
  )?.at(0);
}

export async function fetchPasskey(credentialId: string) {
  return await externalDB?.query.passkey.findFirst({
    where: ({ credentialID }, { eq }) => eq(credentialID, credentialId),
    with: {
      wrappedKeys: true,
    },
  });
}

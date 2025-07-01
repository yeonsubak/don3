'use server';

import { externalDB } from '@/db/external-db/drizzle-client';
import { wrappedKeys } from '@/db/external-db/migration/schema';
import { SYNC_SERVER_URL } from '@/lib/constants';
import type { GetSnapshotResponse } from '@/services/sync-types';
import { cookies } from 'next/headers';

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

export async function hasSyncServer() {
  return !!SYNC_SERVER_URL;
}

export async function fetchLatestSnapshot() {
  if (!SYNC_SERVER_URL) throw new Error('SYNC_SERVER_URL is undefined');

  const cookieStore = await cookies();

  const url = new URL(SYNC_SERVER_URL);
  url.pathname = '/api/v1/sync/snapshots/latest';

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: cookieStore.toString(),
    },
    credentials: 'include',
  });

  if (res.ok) {
    const snapshot: GetSnapshotResponse = await res.json();
    return snapshot;
  }

  throw new Error('res is invalid.');
}

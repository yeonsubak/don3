'use server';

import { externalDB } from '@/db/external-db/drizzle-client';
import { wrappedKeys } from '@/db/external-db/migration/schema';
import type { RestResponse } from '@/dto/dto-primitives';
import type { OpLogRestResponse, SnapshotResponse } from '@/dto/sync-dto';
import { SYNC_SERVER_URL } from '@/lib/constants';
import { cookies } from 'next/headers';
import { serializeCookie } from './server-utils';

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

export async function fetchLatestSnapshot(): Promise<RestResponse<SnapshotResponse>> {
  if (!SYNC_SERVER_URL) throw new Error('SYNC_SERVER_URL is undefined');

  const cookieStore = await cookies();

  const url = new URL(SYNC_SERVER_URL);
  url.pathname = '/api/v1/sync/snapshots/latest';

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: serializeCookie(cookieStore),
    },
  });

  if (!res.ok) {
    throw new Error('res is invalid.');
  }

  const snapshot: RestResponse<SnapshotResponse> = await res.json();
  return snapshot;
}

export async function fetchOpLogsAfterDate(date: Date) {
  if (!SYNC_SERVER_URL) throw new Error('SYNC_SERVER_URL is undefined');

  const cookieStore = await cookies();

  const url = new URL(SYNC_SERVER_URL);
  url.pathname = '/api/v1/sync/opLogs';
  url.searchParams.set('date', date.toISOString());

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: serializeCookie(cookieStore),
    },
  });

  if (!res.ok) {
    throw new Error('res is invalid.');
  }

  const opLogs: OpLogRestResponse = await res.json();
  return opLogs;
}

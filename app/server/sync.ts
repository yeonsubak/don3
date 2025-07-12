'use server';

import { externalDB } from '@/db/external-db/drizzle-client';
import { wrappedKeys } from '@/db/external-db/migration/schema';
import { SYNC_SERVER_URL } from '@/lib/constants';
import type { Document, Message, OpLogDTO, SnapshotDTO } from '@/message';
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

export async function fetchLatestSnapshot(): Promise<{
  message: Message<Document<SnapshotDTO>> | null;
  statusCode: number;
}> {
  if (!SYNC_SERVER_URL) throw new Error('SYNC_SERVER_URL is undefined');

  const cookieStore = await cookies();

  const url = new URL(SYNC_SERVER_URL);
  url.pathname = '/api/v1/sync/snapshots/latest';

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Cookie: serializeCookie(cookieStore),
    },
  });

  let message: Message<Document<SnapshotDTO>> | null = null;
  try {
    message = await res.json();
  } catch (err) {
    console.error(err);
  }

  return {
    message,
    statusCode: res.status,
  };
}

export async function fetchOpLogsAfterDate(date: Date): Promise<{
  message: Message<Document<OpLogDTO>[]> | null;
  statusCode: number;
}> {
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

  let message: Message<Document<OpLogDTO>[]> | null = null;
  try {
    message = await res.json();
  } catch (err) {
    console.error(err);
  }

  return {
    message,
    statusCode: res.status,
  };
}

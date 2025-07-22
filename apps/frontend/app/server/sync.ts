'use server';

import { SYNC_SERVER_URL } from '@/lib/constants';
import type {
  DeviceSyncState,
  Document,
  Message,
  OpLogChunkDTO,
  Query,
  RequestInfo,
  SnapshotDTO,
} from '@/message';
import type { RefreshSnapshotRequiredDTO } from '@/message/dto/snapshot/refresh-snapshot-required-dto';
import type { SnapshotChecksumDTO } from '@/message/dto/snapshot/snapshot-checksum-dto';
import { cookies } from 'next/headers';
import { serializeCookie } from './server-utils';

type FetchResponse<T> = Promise<{
  message: Message<T> | null;
  statusCode: number;
}>;

export async function hasSyncServer() {
  return !!SYNC_SERVER_URL;
}

async function fetchSyncServer<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  params?: Record<string, string> | Message<Query<unknown>>,
): FetchResponse<T> {
  if (!SYNC_SERVER_URL) throw new Error('SYNC_SERVER_URL is undefined');

  const cookieStore = await cookies();
  const url = new URL(SYNC_SERVER_URL);
  url.pathname = endpoint;

  if (method === 'GET' && params) {
    Object.entries(params as Record<string, string>).forEach(([key, value]) =>
      url.searchParams.set(key, value),
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Cookie: serializeCookie(cookieStore),
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: method,
    headers,
    body: method === 'POST' && params ? JSON.stringify(params) : undefined,
  });

  let message: Message<T> | null = null;
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

export async function fetchLatestSnapshot() {
  return fetchSyncServer<Document<SnapshotDTO>>('/api/v1/sync/snapshots/latest', 'GET');
}

export async function fetchLatestSnapshotChecksum() {
  return fetchSyncServer<Document<SnapshotChecksumDTO>>(
    '/api/v1/sync/snapshots/latest/checksum',
    'GET',
  );
}

export async function fetchOpLogsAfterDate(date: Date) {
  return await fetchSyncServer<Document<OpLogChunkDTO[]>>('/api/v1/sync/opLogs', 'GET', {
    date: date.toISOString(),
  });
}

export async function fetchSavedOpLogs(
  deviceIdAndSeq: DeviceSyncState[],
  requestInfo: RequestInfo,
) {
  const endpoint = '/api/v1/sync/opLogs/query';

  const query: Query<DeviceSyncState[]> = {
    type: 'getOpLogs',
    parameters: deviceIdAndSeq,
    timestamp: new Date().toISOString(),
  };
  const message: Message<Query<DeviceSyncState[]>> = {
    requestInfo,
    destination: endpoint,
    type: 'query',
    body: query,
    sentAt: new Date().toISOString(),
  };

  return await fetchSyncServer<Document<OpLogChunkDTO[]>>(endpoint, 'POST', message);
}

export async function fetchRefreshSnapshotRequired() {
  return fetchSyncServer<Document<RefreshSnapshotRequiredDTO>>(
    '/api/v1/sync/snapshots/refresh-required',
    'GET',
  );
}

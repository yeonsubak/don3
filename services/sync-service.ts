import { generatePasskeyAuthenticationOptions } from '@/app/server/authenticate';
import {
  fetchLatestSnapshot,
  fetchOpLogsAfterDate,
  fetchPasskey,
  insertWrappedKey,
} from '@/app/server/sync';
import { appDrizzle } from '@/db';
import { PGliteAppWorker } from '@/db/pglite/pglite-app-worker';
import type {
  Algorithm,
  EncryptKeyType,
  KeyRegistryType,
  OpLogInsert,
  SnapshotInsert,
} from '@/db/sync-db/drizzle-types';
import type { GetSnapshotResponse, OpLogResponse } from '@/dto/sync-dto';
import { insertOperationLogMutex } from '@/lib/async-mutex';
import { addPasskey } from '@/lib/better-auth/auth-client';
import { LOCAL_STORAGE_KEYS, OPERATION_LOG_VERSION } from '@/lib/constants';
import {
  arrayBufferToBase64,
  base64ToUint8Array,
  decryptWithEK,
  deriveKeyEncryptionKey,
  deserializeEncryptionKey,
  encryptWithEK,
  serializeEncryptionKey,
  stringify,
  unwrapEK,
} from '@/lib/utils/encryption-utils';
import { SyncRepository } from '@/repositories/sync-repository';
import type { Query } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { Service } from './abstract-service';
import { BackupService, type DumpMetaData } from './backup-service';
import { getBackupService } from './service-helpers';

export class SyncService extends Service {
  private syncRepository: SyncRepository;

  constructor(syncRepository: SyncRepository) {
    super();
    this.syncRepository = syncRepository;
  }

  public async getKeyRegistry(credentialId: string) {
    return await this.syncRepository.getKeyRegistry(credentialId);
  }

  public async getWrappedKey(credentialId: string) {
    const keyRegistry = await this.getKeyRegistry(credentialId);
    const wrappedKey = keyRegistry?.encryptKeys?.find((key) => key.type === 'single');
    if (!wrappedKey) {
      const passkey = await fetchPasskey(credentialId);
      if (!passkey || passkey.wrappedKeys.length < 0) {
        throw new Error('passkey.wrappedKeys not found');
      }

      const insertEKRes: Awaited<ReturnType<typeof this.insertEncryptionKey>>[] = [];

      for (const wrappedKey of passkey.wrappedKeys) {
        const res = await this.insertEncryptionKey({
          mode: 'sync',
          passkeyId: wrappedKey.passkeyId,
          algorithm: wrappedKey.algorithm,
          credentialId: credentialId,
          keyRegistryType: 'symmetric',
          keyType: 'single',
          prfSalt: wrappedKey.prfSalt,
          publicKey: passkey.publicKey,
          wrappedEk: wrappedKey.wrappedKey,
          userId: passkey.userId,
        });
        insertEKRes.push(res);
      }

      return insertEKRes.at(0)?.encryptKey;
    }

    return wrappedKey;
  }

  public async insertEncryptionKey({
    passkeyId,
    credentialId,
    keyRegistryType,
    keyType,
    algorithm,
    wrappedEk,
    publicKey,
    prfSalt,
    mode,
    userId,
  }: {
    passkeyId: string;
    credentialId: string;
    keyRegistryType: KeyRegistryType;
    keyType: EncryptKeyType;
    algorithm: Algorithm;
    wrappedEk: ArrayBuffer | string;
    publicKey: string;
    prfSalt: BufferSource | string;
    mode: 'local' | 'sync';
    userId: string;
  }) {
    const wrappedEkBase64 =
      typeof wrappedEk === 'string' ? wrappedEk : arrayBufferToBase64(wrappedEk);

    return await this.syncRepository.withTx(async (tx) => {
      try {
        const repoWithTx = new SyncRepository(tx);
        const keyRegistry = await repoWithTx.insertKeyRegistry({
          credentialId,
          type: keyRegistryType,
          userId,
        });
        if (!keyRegistry) throw new Error('keyRegistry not found.');

        const encryptKey = await repoWithTx.insertEncryptKey({
          registryId: keyRegistry.id,
          type: keyType,
          algorithm,
          key: wrappedEkBase64,
          isKeyWrapped: true,
        });

        const publicKeyInserted = await repoWithTx.insertEncryptKey({
          registryId: keyRegistry.id,
          type: 'public',
          algorithm: 'RSA',
          key: publicKey,
          isKeyWrapped: false,
        });

        const prfSaltBase64 = typeof prfSalt === 'string' ? prfSalt : arrayBufferToBase64(prfSalt);

        let wrappedKeyToSyncDB;
        if (mode === 'local') {
          wrappedKeyToSyncDB = await this.insertWrappedKeyToSyncDB(
            passkeyId,
            wrappedEkBase64,
            prfSaltBase64,
          );
        }

        return {
          keyRegistry,
          encryptKey,
          publicKey: publicKeyInserted,
          wrappedKeyToSyncDB,
        };
      } catch (err) {
        console.error(err);
        tx.rollback();
        throw err;
      }
    });
  }

  public async getValidEncryptionKey(triggerPasskeyAuth: boolean): Promise<CryptoKey | null> {
    const now = new Date();
    const validTempKey = await this.syncRepository.getValidTempKey(now);
    if (validTempKey) {
      return await deserializeEncryptionKey(validTempKey.serializedKey);
    }

    if (triggerPasskeyAuth) {
      const { credentialId, prf } = await this.generatePRF();
      const wrappedKey = await this.getWrappedKey(credentialId);
      if (!wrappedKey) throw new Error('wrappedKey not found.');

      const ek = await unwrapEK(wrappedKey.key, prf.first);
      const ekSerialized = await serializeEncryptionKey(ek);
      await this.insertTempKey(ekSerialized);
      return ek;
    }

    return null;
  }

  private async insertTempKey(serializedKey: string) {
    const now = DateTime.now();
    const oneWeekLater = now.plus({ week: 1 });

    return this.syncRepository.insertTempKey({
      serializedKey,
      expireAt: oneWeekLater.toJSDate(),
    });
  }

  public async registerPasskey() {
    const { publicKey, id: passkeyId, userId } = await addPasskey();
    const { prf, credentialId } = await this.generatePRF();
    const { wrappedEK, ekKey } = await this.createCryptoKeys(prf.first);
    await this.insertEncryptionKey({
      mode: 'local',
      passkeyId,
      credentialId: credentialId,
      keyRegistryType: 'symmetric',
      keyType: 'single',
      algorithm: 'AES-KW',
      wrappedEk: wrappedEK,
      publicKey,
      prfSalt: prf.first,
      userId,
    });

    const serializedEkKey = await serializeEncryptionKey(ekKey);
    await this.insertTempKey(serializedEkKey);

    return ekKey;
  }

  public async getNextSeq(deviceId: string) {
    const currentMaxSeq = (await this.syncRepository.getMaxSeq(deviceId))?.value;
    return !currentMaxSeq ? 1 : currentMaxSeq + 1;
  }

  public async getAllSnapshots() {
    return await this.syncRepository.getAllSnapshots();
  }

  public async getLatestSnapshot() {
    return this.syncRepository.getLatestSnapshot();
  }

  public async getUploadableSnapshots() {
    return this.syncRepository.getUploadableSnapshots();
  }

  public async hasSnapshot() {
    return this.syncRepository.hasSnapshot();
  }

  public async insertSnapshot(data: SnapshotInsert, isUploaded: boolean = false) {
    const res = await this.syncRepository.withTx(async (tx) => {
      try {
        const syncRepo = new SyncRepository(tx);
        const snapshot = await syncRepo.insertSnapshot(data);
        if (!snapshot) throw new Error('snapshot is undefined');

        const syncStatus = await syncRepo.insertSnapshotSyncStatus({
          snapshotId: snapshot.id,
          isUploaded,
        });

        return {
          ...snapshot,
          syncStatus,
        };
      } catch (err) {
        console.error(err);
        tx.rollback();
      }
    });

    return res;
  }

  public async updateSnapshotStatus(snapshotId: string, isUploaded: boolean, receiveAt: string) {
    return await this.syncRepository.updateSnapshotSyncStatus(
      snapshotId,
      isUploaded,
      new Date(receiveAt),
    );
  }

  public async insertOpLog(query: Query): Promise<OpLogInsert | undefined> {
    return await insertOperationLogMutex.runExclusive(async () => {
      const deviceId = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEVICE_ID);
      const appSchemaVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
      if (!deviceId) throw new Error('deviceId not found.');
      if (!appSchemaVersion) throw new Error('schemaVersion not found.');

      const nextSeq = await this.getNextSeq(deviceId);

      const res = await this.syncRepository.withTx(async (tx) => {
        const repo = new SyncRepository(tx);
        try {
          const opLog = await repo.insertOpLog({
            version: OPERATION_LOG_VERSION,
            schemaVersion: appSchemaVersion,
            deviceId: deviceId.replace(/\s+/g, ''),
            sequence: nextSeq,
            data: query,
          });

          if (!opLog) throw new Error('Result of insertOpLog is undefined');

          const syncStatus = await repo.insertOpLogSyncStatus({
            logId: opLog.id,
            isUploaded: false,
          });

          return {
            ...opLog,
            syncStatus,
          };
        } catch (err) {
          console.error(err);
          tx.rollback();
        }
      });

      return res;
    });
  }

  public async updateOpLogStatus(logId: string, isUploaded: boolean, receiveAt: string) {
    return await this.syncRepository.updateOpLogSyncStatus(logId, isUploaded, new Date(receiveAt));
  }

  public async getUploadableOpLogs() {
    return this.syncRepository.getUploadableOpLogs();
  }

  public async syncFromScratch(): Promise<{ status: 'success' | 'fail'; message: string }> {
    const ek = await this.getValidEncryptionKey(true);
    if (!ek) throw new Error('Retrieving an encryption key failed.');

    const deviceId = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEVICE_ID);
    if (!deviceId) throw new Error('deviceId is undefined in local storage');

    const snapshotRes = await this.getLatestSnapshotFromServer();

    switch (snapshotRes.statusCode) {
      case 200: {
        const { dump, meta, iv: ivBase64, schemaVersion } = snapshotRes.data;
        const iv = base64ToUint8Array(ivBase64);

        const decryptedDump = await decryptWithEK(dump, iv, ek);
        const decryptedMeta: DumpMetaData = JSON.parse(await decryptWithEK(meta, iv, ek));

        const decompressedDump = decryptedMeta.compressed
          ? BackupService.decompressGzipBase64(decryptedDump)
          : decryptedDump;
        decryptedMeta.compressed = false;

        const insertedSnapshot = await this.insertSnapshot(
          {
            schemaVersion,
            type: 'autosave',
            meta: decryptedMeta,
            dump: decompressedDump,
            deviceId,
          },
          true,
        );

        const backupService = await getBackupService();
        const restoreRes = await backupService.restoreDB(
          {
            metaData: decryptedMeta,
            dump: decompressedDump,
          },
          false,
        );

        const opLogs = await this.getOpLogsAfterSnapshotDate(snapshotRes);
        const opLogRestoreRes = await this.insertFetchedOpLogs(opLogs);

        return {
          status: 'success',
          message: 'Syncing database from the cloud success.',
        };
      }
      case 404: {
        console.warn('Snapshot data not found in the server.');
      }
      default: {
        return {
          status: 'fail',
          message: 'Sync failed. StatusCode: ${snapshot.statusCode}. Reroute to ?syncSignIn=false.',
        };
      }
    }
  }

  public async encryptData(data: unknown, iv: Uint8Array<ArrayBuffer>) {
    const stringified = stringify(data);
    const ek = await this.getValidEncryptionKey(false);
    if (!ek)
      throw new Error(
        'Cannot find valid encryption key. It requires a passkey authentication by the user',
      );

    return await encryptWithEK(stringified, ek, iv);
  }

  public async decryptData(data: string, iv: Uint8Array<ArrayBuffer>) {
    const ek = await this.getValidEncryptionKey(false);
    if (!ek)
      throw new Error(
        'Cannot find valid encryption key. It requires a passkey authentication by the user',
      );
    return await decryptWithEK(data, iv, ek);
  }

  private async insertWrappedKeyToSyncDB(passkeyId: string, wrappedKey: string, prfSalt: string) {
    return await insertWrappedKey(passkeyId, wrappedKey, prfSalt);
  }

  private async generatePRF() {
    const options = await generatePasskeyAuthenticationOptions();
    const authOption = PublicKeyCredential.parseRequestOptionsFromJSON({
      ...options,
      extensions: {
        prf: undefined,
      },
    });
    const credential = (await navigator.credentials.get({
      publicKey: {
        ...authOption,
        extensions: {
          prf: options.extensions?.prf,
        },
      },
    })) as PublicKeyCredential;
    const prf = credential.getClientExtensionResults().prf?.results;

    if (!prf?.first) {
      throw new Error('prf.first not found.');
    }
    return {
      credentialId: credential.id,
      prf,
    };
  }

  private async createCryptoKeys(prfOutput: BufferSource) {
    const ekRaw = crypto.getRandomValues(new Uint8Array(32));

    const kekKey = await deriveKeyEncryptionKey(prfOutput);

    const ekKey = await crypto.subtle.importKey('raw', ekRaw, { name: 'AES-GCM' }, true, [
      'encrypt',
      'decrypt',
    ]);

    const wrappedEK = await crypto.subtle.wrapKey('raw', ekKey, kekKey, 'AES-KW');

    return {
      ek: ekRaw, // Uint8Array
      kekKey, // CryptoKey for wrapping
      ekKey, // CryptoKey for encryption
      wrappedEK, // ArrayBuffer
    };
  }

  private async insertFetchedOpLogs(opLogRes: OpLogResponse) {
    opLogRes.data.sort((a, b) => a.sequence - b.sequence);

    const res = [];
    for (const { data, iv: ivBase64 } of opLogRes.data) {
      const iv = base64ToUint8Array(ivBase64);
      const decryptedData = await this.decryptData(data, iv);
      const { sql, params }: Query = JSON.parse(decryptedData);
      const drizzle = appDrizzle(await PGliteAppWorker.getInstance());
      const queryRes = await drizzle.$client.query(sql, params);
      res.push(queryRes);
    }
    return res;
  }

  private async getLatestSnapshotFromServer() {
    return fetchLatestSnapshot();
  }

  private async getOpLogsAfterSnapshotDate(snapshotRes: GetSnapshotResponse) {
    const date = new Date(snapshotRes.data.createAt);
    return fetchOpLogsAfterDate(date);
  }
}

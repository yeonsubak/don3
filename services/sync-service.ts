import { generatePasskeyAuthenticationOptions } from '@/app/server/authenticate';
import { fetchPasskey, insertWrappedKey } from '@/app/server/sync';
import type {
  Algorithm,
  EncryptKeyType,
  KeyRegistryType,
  OperationLogInsert,
  OperationLogSelect,
  SnapshotInsert,
} from '@/db/sync-db/drizzle-types';
import { insertOperationLogMutex } from '@/lib/async-mutex';
import { addPasskey } from '@/lib/better-auth/auth-client';
import { LOCAL_STORAGE_KEYS, OPERATION_LOG_VERSION } from '@/lib/constants';
import {
  arrayBufferToBase64,
  deriveKeyEncryptionKey,
  deserializeEncryptionKey,
  serializeEncryptionKey,
  unwrapEK,
} from '@/lib/utils/encryption-utils';
import { getMethod } from '@/repositories/sync-method-mapper';
import { SyncRepository } from '@/repositories/sync-repository';
import { DateTime } from 'luxon';
import { Service } from './abstract-service';

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

  public async insertOperationLog(
    methodName: string,
    methodHash: string,
    data: Record<string, unknown>,
  ): Promise<OperationLogInsert | undefined> {
    return await insertOperationLogMutex.runExclusive(async () => {
      const deviceId = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEVICE_ID);
      const appSchemaVersion = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.SCHEMA_VERSION);
      if (!deviceId) throw new Error('deviceId not found.');
      if (!appSchemaVersion) throw new Error('schemaVersion not found.');

      const nextSeq = await this.getNextSeq(deviceId);

      const insertObj: OperationLogInsert = {
        version: OPERATION_LOG_VERSION,
        schemaVersion: appSchemaVersion,
        deviceId: deviceId.replace(/\s+/g, ''),
        sequence: nextSeq,
        method: methodName,
        methodHash,
        opData: data,
      };

      const res = await this.syncRepository.insertOperationLog(insertObj);

      return res;
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
    const one = BigInt(1);
    return !currentMaxSeq ? one : currentMaxSeq + one;
  }

  public async getAllSnapshots() {
    return await this.syncRepository.getAllSnapshots();
  }

  public async insertSnapshot(data: SnapshotInsert) {
    return await this.syncRepository.insertSnapshot(data);
  }

  public async hasSnapshot() {
    return this.syncRepository.hasSnapshot();
  }

  public async syncDataFromServer({ method: _method, opData }: OperationLogSelect) {
    const { method, repository } = await getMethod(_method);
    const res = await method.apply(repository, [opData]);
    return res;
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
}

export function plaintextToBase64(plaintext: string) {
  const utf8Bytes = new TextEncoder().encode(plaintext);
  return btoa(String.fromCharCode(...utf8Bytes));
}

export function base64ToPlaintext(base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function uInt8ArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

export function arrayBufferToBase64(arrayBuffer: BufferSource): string {
  const buffer =
    arrayBuffer instanceof ArrayBuffer
      ? arrayBuffer
      : arrayBuffer.buffer.slice(
          arrayBuffer.byteOffset,
          arrayBuffer.byteOffset + arrayBuffer.byteLength,
        );
  const bytes = new Uint8Array(buffer);
  return uInt8ArrayToBase64(bytes);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function base64ToUint8Array(base64: string) {
  return new Uint8Array(base64ToArrayBuffer(base64));
}

export async function deriveKeyEncryptionKey(prfOutput: BufferSource) {
  return await crypto.subtle.importKey('raw', prfOutput, { name: 'AES-KW' }, false, [
    'wrapKey',
    'unwrapKey',
  ]);
}

export async function unwrapEK(
  wrappedEKBase64: string,
  prfOutput: BufferSource,
): Promise<CryptoKey> {
  const wrappedEK = base64ToArrayBuffer(wrappedEKBase64);
  const kekKey = await deriveKeyEncryptionKey(prfOutput);
  const ekKey = await crypto.subtle.unwrapKey(
    'raw',
    wrappedEK,
    kekKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );

  return ekKey;
}

export function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function encryptWithEK(
  plaintext: string,
  ekKey: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<string> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    ekKey,
    encoded,
  );

  return arrayBufferToBase64(ciphertext);
}

export async function decryptWithEK(
  ciphertext: string,
  iv: Uint8Array,
  ekKey: CryptoKey,
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    ekKey,
    base64ToArrayBuffer(ciphertext),
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export async function serializeEncryptionKey(key: CryptoKey) {
  const res = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(res);
}

export async function deserializeEncryptionKey(base64Key: string) {
  const keyArrayBuffer = base64ToArrayBuffer(base64Key);
  const ekKey = await crypto.subtle.importKey('raw', keyArrayBuffer, { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);
  return ekKey;
}

export function stringify(input: unknown) {
  switch (typeof input) {
    case 'object':
      return JSON.stringify(input);
    case 'symbol':
      throw new Error('symbol cannot be stringified.');
    case 'function':
      throw new Error('function cannot be stringified.');
    default:
      return String(input);
  }
}

import { BackupService } from '@/services/backup-service';
import { describe, expect, test } from 'vitest';

describe('BackupService', { timeout: 1000 }, () => {
  describe('decompressGzipBase64()', () => {
    test('should return human-readable string', async () => {
      const testString = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Sed ut egestas lectus, et efficitur eros.
      Sed sagittis iaculis ligula id interdum.
      Suspendisse ultricies laoreet rutrum.
      Morbi venenatis commodo leo quis eleifend.
      Fusce lobortis condimentum est, non pellentesque augue iaculis tempor.
      Nunc euismod pretium ipsum vitae rhoncus.
      Mauris quis finibus augue, a venenatis metus.
      Vestibulum sollicitudin tincidunt nunc vel volutpat.
      Suspendisse potenti.
      `;

      const compressed = BackupService.compressGzipBase64(testString);
      const decompressed = BackupService.decompressGzipBase64(compressed);
      expect(decompressed).toBe(testString);
    });
  });

  describe('compressGzipBase64()', () => {
    test('', async () => {});
  });
});

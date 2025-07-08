import { type RestResponse } from '@/dto/dto-primitives';
import { isRestResponse, type OpLogResponse } from '@/dto/sync-dto';
import { describe, expect, test } from 'vitest';

describe('Test DTO related to Sync', () => {
  describe('isRestResponse()', () => {
    test('should return true', () => {
      const obj: RestResponse = {
        status: 'SUCCESS',
        statusCode: 200,
        message: '',
        data: {
          localId: '',
        },
        sentAt: '',
      };
      expect(isRestResponse(obj)).toBe(true);
    });
    test('should return false', () => {
      const obj: OpLogResponse = {
        data: '',
        deviceId: '',
        id: '',
        iv: '',
        localId: '',
        queryKeys: [],
        schemaVersion: '',
        sequence: 1,
        userId: '',
        version: '',
      };
      expect(isRestResponse(obj)).toBe(false);
    });
  });
});

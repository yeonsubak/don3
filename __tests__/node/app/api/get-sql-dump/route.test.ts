import { extractOrderFromFileName } from '@/app/api/get-schema-definition/functions';
import { describe, expect, test } from 'vitest';

describe('File handling functions', () => {
  test.each([
    ['0000_glamorous_mongu.sql', 0],
    ['0001_glamorous_mongu.sql', 1],
    ['0002_glamorous_mongu.sql', 2],
    ['0052_glamorous_mongu.sql', 52],
    ['0199_glamorous_mongu.sql', 199],
    ['9999_glamorous_mongu.sql', 9999],
    ['glamorous_mongu.sql', -1],
  ])(
    'should return a number value from the prefix of a file delimited by underscore. If the number value is null, it should return -1',
    (fileName, expected) => {
      const result = extractOrderFromFileName(fileName);
      console.log(`Input: ${fileName} | Expected: ${expected} | Got: ${result}`);
      expect(result).toBe(expected);
    },
  );
});

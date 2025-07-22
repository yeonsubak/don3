import { printTestResult } from '@/__tests__/common';
import {
  compareSemanticVersions,
  extractSemanticVersion,
  isValidVersionedSQL,
} from '@/db/db-helper';
import { promises as fs } from 'fs';
import { describe, expect, test } from 'vitest';

describe('Extract semantic version from the file name', () => {
  test.each([
    ['ver-0.0.1.sql', '0.0.1'],
    ['ver-1.0.0.sql', '1.0.0'],
    ['ver-2.10.3.sql', '2.10.3'],
    ['ver-0.1.0.sql', '0.1.0'],
    ['ver-3.0.0.sql', '3.0.0'],
    ['version-1.0.0.sql', null],
    ['ver-1.sql', null],
    ['ver-1.0.sql', null],
    ['ver-1.0.0-beta', null],
  ])(
    'should return the semantic version. If the version is invalid, it should return null.',
    (fileName, expected) => {
      const result = extractSemanticVersion(fileName);
      printTestResult(fileName, expected, result);
      expect(result).toBe(expected);
    },
  );
});

describe('Are drizzle migration files are in the right convention?', async () => {
  const sqlFileNames = (await fs.readdir('db/app-db/migration')).filter((fileName) =>
    fileName.endsWith('.sql'),
  );
  const testArgs = sqlFileNames.map((fileName) => [fileName, true]);

  test.each(testArgs)('should return true', (fileName, expected) => {
    const result = isValidVersionedSQL(fileName as string);
    printTestResult(fileName, expected, result);
    expect(result).toBe(expected);
  });
});

describe('isValidVersionedSQL', () => {
  test.each([
    ['ver-1.0.0.sql', true],
    ['ver-2.10.3.sql', true],
    ['ver-0.1.0.sql', true],
    ['ver-3.0.0.sql', true],
    ['version-1.0.0.sql', false],
    ['ver-1.sql', false],
    ['ver-1.0.sql', false],
    ['ver-1.0.0-beta', false],
  ])('should follow semantic versioning convention', (input: string, expected: boolean) => {
    const result = isValidVersionedSQL(input);
    printTestResult(input, expected, result);
    expect(result).toBe(expected);
  });
});

describe('compareSemanticVersion', () => {
  test.each([
    [
      ['1.5.0', '0.1.0', '0.0.1', '2.8.0', '0.0.38', '1.0.2'],
      ['0.0.1', '0.0.38', '0.1.0', '1.0.2', '1.5.0', '2.8.0'],
    ],
  ])('should be sorted in ascending order', (input: string[], expected: string[]) => {
    const result = input.toSorted(compareSemanticVersions);
    printTestResult(input, expected, result);
    expect(result).toStrictEqual(expected);
  });
});

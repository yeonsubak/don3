import { createInMemoryPGLiteDrizzle } from '@/__tests__/common';
import { DATASET_COUNTRY } from '@/db/dataset/country';
import { DATASET_CURRENCY_FIAT } from '@/db/dataset/currency';
import type { ForexInsert } from '@/db/drizzle-types';
import { ConfigRepository } from '@/repositories/config-repository';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, test } from 'vitest';

describe('ConfigRepository', { timeout: 2000 }, () => {
  let repo: ConfigRepository;

  const FX_RATES: ForexInsert[] = [
    {
      date: '2024-10-11',
      baseCurrency: 'USD',
      targetCurrency: 'KRW',
      rate: '1385.11',
      createAt: DateTime.fromObject({ year: 2024, month: 10, day: 11 }).toJSDate(),
    },
    {
      date: '2025-05-15',
      baseCurrency: 'PLN',
      targetCurrency: 'KRW',
      rate: '369.80',
      createAt: DateTime.fromObject({ year: 2025, month: 5, day: 15 }).toJSDate(),
    },
    {
      date: '2025-05-14',
      baseCurrency: 'PLN',
      targetCurrency: 'KRW',
      rate: '368.50',
      createAt: DateTime.fromObject({ year: 2025, month: 5, day: 14 }).toJSDate(),
    },
  ];

  beforeEach(async () => {
    const pg = await createInMemoryPGLiteDrizzle('app');
    repo = new ConfigRepository(pg);
  });

  describe('getAllCurrencies', () => {
    test('should return all currencies', async () => {
      const allCurrencies = await repo.getAllCurrencies();
      expect(allCurrencies.length).toBe(DATASET_CURRENCY_FIAT.length);
    });
  });

  describe('getCurrencyByCode', () => {
    test('should return the currency object for USD', async () => {
      const currency = await repo.getCurrencyByCode('USD');
      const expected = {
        id: '19200d12-572c-4d48-8847-bf0bad398542',
        type: 'fiat',
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$',
        symbolNative: '$',
        isoDigits: 2,
      };
      expect(currency).not.toBeUndefined();
      expect(currency).toMatchObject(expected);
    });

    test('should return the currency object for KRW', async () => {
      const currency = await repo.getCurrencyByCode('KRW');
      const expected = {
        id: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
        type: 'fiat',
        name: 'South Korean Won',
        code: 'KRW',
        symbol: '₩',
        symbolNative: '₩',
        isoDigits: 0,
      };
      expect(currency).not.toBeUndefined();
      expect(currency).toMatchObject(expected);
    });

    test('should return the currency object for PLN', async () => {
      const currency = await repo.getCurrencyByCode('PLN');
      const expected = {
        id: '2f36d00e-dac9-49a3-9354-6e870368bd37',
        type: 'fiat',
        name: 'Polish Zloty',
        code: 'PLN',
        symbol: 'zł',
        symbolNative: 'zł',
        isoDigits: 2,
      };
      expect(currency).not.toBeUndefined();
      expect(currency).toMatchObject(expected);
    });
  });

  describe('getAllCountries', () => {
    test('should return all countries', async () => {
      const allCountries = await repo.getAllCountries();
      expect(allCountries.length).toBe(DATASET_COUNTRY.length);
    });
  });

  describe('getCountryByCode', () => {
    test('should return the country object for USA', async () => {
      const country = await repo.getCountryByCode('USA');
      const expected = {
        id: '5f0a58bb-f626-417e-8489-165e6f463c62',
        name: 'United States',
        code: 'USA',
        codeAlpha2: 'US',
        defaultCurrencyId: '19200d12-572c-4d48-8847-bf0bad398542',
        emoji: '🇺🇸',
      };
      expect(country).not.toBeUndefined();
      expect(country).toMatchObject(expected);
    });

    test('should return the country object for KOR', async () => {
      const country = await repo.getCountryByCode('KOR');
      const expected = {
        id: 'ac2c2eb6-29d1-4858-a552-026d51d72f94',
        name: 'South Korea',
        code: 'KOR',
        codeAlpha2: 'KR',
        defaultCurrencyId: '0449fd3c-e5bb-4124-8784-169ddbfc072b',
        emoji: '🇰🇷',
      };
      expect(country).not.toBeUndefined();
      expect(country).toMatchObject(expected);
    });

    test('should return the country object for POL', async () => {
      const country = await repo.getCountryByCode('POL');
      const expected = {
        id: '8ac291d3-f38c-41a7-90ee-207fa6ba8356',
        name: 'Poland',
        code: 'POL',
        codeAlpha2: 'PL',
        defaultCurrencyId: '2f36d00e-dac9-49a3-9354-6e870368bd37',
        emoji: '🇵🇱',
      };
      expect(country).not.toBeUndefined();
      expect(country).toMatchObject(expected);
    });
  });

  describe('getCountriesByCode', () => {
    test('should return the array of country objects: EST, CHN, JPN, JAM', async () => {
      const countries = await repo.getCountriesByCode(['EST', 'CHN', 'JPN', 'JAM']);
      const expected = [
        {
          id: '13fde573-8659-4a4f-9c39-2dda7f3ec2bf',
          name: 'Jamaica',
          code: 'JAM',
          codeAlpha2: 'JM',
          defaultCurrencyId: '4a5b7a26-fcec-4ef1-a1df-a1e3a11b7716',
          emoji: '🇯🇲',
        },
        {
          id: 'd5f83da7-c5f5-495c-b000-272130802204',
          name: 'Japan',
          code: 'JPN',
          codeAlpha2: 'JP',
          defaultCurrencyId: 'f33a4c09-de77-4ebb-add2-4ceb7312439a',
          emoji: '🇯🇵',
        },
        {
          id: '01558acb-e265-4630-b83b-91a4f8b3433f',
          name: 'Estonia',
          code: 'EST',
          codeAlpha2: 'EE',
          defaultCurrencyId: '317c8111-4e0e-4933-b507-d9374aab32fe',
          emoji: '🇪🇪',
        },
        {
          id: '5b01586e-b919-4241-b3b7-0536491e41cd',
          name: 'China',
          code: 'CHN',
          codeAlpha2: 'CN',
          defaultCurrencyId: '2538f674-2c63-40d3-8c15-952d54f6a485',
          emoji: '🇨🇳',
        },
      ];

      expect(countries).not.toBeUndefined();
      expect(countries.length).toBe(expected.length);
      countries.forEach((country) => {
        const targetCountry = expected.find((e) => e.code === country.code);
        expect(targetCountry).not.toBeUndefined();
        expect(country).toMatchObject(targetCountry!);
      });
    });
  });

  describe('getUserConfig', () => {
    test('should return userConfig value', async () => {
      await repo.insertUserConfig('defaultCountry', 'KOR');
      const result = await repo.getUserConfig('defaultCountry');
      expect(result).not.toBeUndefined();
      expect(result?.name).toBe('defaultCountry');
      expect(result?.value).toBe('KOR');
    });
  });

  describe('insertUserConfig', () => {
    test('should insert and return userConfig value', async () => {
      const result = await repo.insertUserConfig('defaultCountry', 'POL');
      expect(result).not.toBeUndefined();
      expect(result?.name).toBe('defaultCountry');
      expect(result?.value).toBe('POL');
    });
  });

  describe('updateUserConfig', () => {
    test('should update and return userConfig value', async () => {
      await repo.insertUserConfig('defaultCountry', 'KOR');
      const updateResult = await repo.updateUserConfig('defaultCountry', 'POL');
      expect(updateResult).not.toBeUndefined();
      expect(updateResult?.name).toBe('defaultCountry');
      expect(updateResult?.value).toBe('POL');
    });
  });

  describe('insertFxRate', () => {
    test('should insert and return fxRate objects', async () => {
      const result = await repo.insertFxRate(FX_RATES.slice(0, 2));
      expect(result).not.toBeUndefined();
      expect(result.length).toBe(2);
      result.forEach((fxRate) => {
        const expected = FX_RATES.find(
          (e) =>
            e.baseCurrency === fxRate.baseCurrency && e.targetCurrency === fxRate.targetCurrency,
        );
        expect(expected).not.toBeUndefined();
        expect(fxRate.baseCurrency).toBe(expected?.baseCurrency);
        expect(fxRate.targetCurrency).toBe(expected?.targetCurrency);
        expect(fxRate.rate).toBe(expected?.rate);
        expect(fxRate.date).toBe(expected?.date);
      });
    });
  });

  describe('getLatestFxRate', () => {
    test('should return the latest fxRate object in range of time', async () => {
      await repo.insertFxRate(FX_RATES);

      const pln = await repo.getCurrencyByCode('PLN');
      const krw = await repo.getCurrencyByCode('KRW');
      const start = DateTime.fromObject({ year: 2025, month: 5, day: 13 });
      const end = DateTime.fromObject({ year: 2025, month: 5, day: 15 });

      const result = await repo.getLatestFxRate({
        baseCurrency: pln!,
        targetCurrencies: [krw!],
        timeRange: { start, end },
      });
      expect(result.length).not.toBe(0);
      expect(result.at(0)?.baseCurrency).toBe('PLN');
      expect(result.at(0)?.targetCurrency).toBe('KRW');
      expect(result.at(0)?.date).toBe('2025-05-15');
      expect(result.at(0)?.rate).toBe('369.80');
    });
  });
});

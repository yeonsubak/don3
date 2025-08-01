'use client';

import { fetchFxRate } from '@/app/server/fx-rate';
import type { UserConfigKey } from '@/db/app-db/schema';
import type {
  CountrySelect,
  CurrencySelect,
  ForexInsert,
  ForexSelect,
} from '@/db/app-db/drizzle-types';
import { DateTime } from 'luxon';
import { ConfigRepository } from '../repositories/config-repository';
import { Service } from './abstract-service';

export class ConfigService extends Service {
  private configRepository: ConfigRepository;

  constructor(configRepository: ConfigRepository) {
    super();
    this.configRepository = configRepository;
  }

  public async getAllCurrencies() {
    return await this.configRepository.getAllCurrencies();
  }

  public async getCurrencyByCode(code: string) {
    return await this.configRepository.getCurrencyByCode(code);
  }

  public async getDefaultCurrency() {
    const defaultCurrency = await this.configRepository.getUserConfig('defaultCurrency');
    return await this.configRepository.getCurrencyByCode(defaultCurrency?.value ?? 'USD');
  }

  public async getDefaultCountry() {
    const defaultCountry = await this.configRepository.getUserConfig('defaultCountry');
    return await this.configRepository.getCountryByCode(defaultCountry?.value ?? 'USA');
  }

  public async getAllCountries() {
    return await this.configRepository.getAllCountries();
  }

  public async getCountriesByCode(countryCodes: string[]) {
    return await this.configRepository.getCountriesByCode(countryCodes);
  }

  public async getCountriesInUse(): Promise<CountrySelect[]> {
    return this.configRepository.getContriesInUse();
  }

  public async getLatestFxRate(
    baseCurrencies: CurrencySelect[],
    targetCurrencies: CurrencySelect[],
  ): Promise<ForexSelect[]> {
    const fxRateResult: ForexSelect[] = [];

    const createFxRateRequest = async (
      baseCurrency: CurrencySelect,
      targetCurrencies: CurrencySelect[],
    ) => {
      targetCurrencies = targetCurrencies.filter((currency) => currency.id !== baseCurrency.id);

      if (targetCurrencies.length === 0) {
        return [];
      }

      const targetCurrencyCodes = targetCurrencies.map((currency) => currency.code);
      const now = DateTime.now();
      let fxRates = await this.configRepository.getLatestFxRate({
        baseCurrency,
        targetCurrencies,
        timeRange: {
          start: now.minus({ hours: 4 }),
          end: now,
        },
      });

      if (
        fxRates.length > 0 &&
        fxRates.every((rate) => targetCurrencyCodes.includes(rate.targetCurrency))
      ) {
        fxRateResult.push(...fxRates);
        return;
      }

      const fetchedFxRates = await fetchFxRate(baseCurrency.code, targetCurrencyCodes.join(','));

      const fxRateInserts: ForexInsert[] = fetchedFxRates
        ? Object.entries(fetchedFxRates.rates).map(([key, value]) => ({
            date: fetchedFxRates.date,
            baseCurrency: baseCurrency.code,
            targetCurrency: key,
            rate: value.toFixed(5),
          }))
        : [];

      fxRates = await this.configRepository.insertFxRate(fxRateInserts);

      fxRateResult.push(...fxRates);
    };

    await Promise.allSettled(
      baseCurrencies.map((baseCurrency) => createFxRateRequest(baseCurrency, targetCurrencies)),
    );

    return fxRateResult;
  }

  public async getUserConfig(key: UserConfigKey) {
    return await this.configRepository.getUserConfig(key);
  }

  public async upsertUserConfig(key: UserConfigKey, value: string) {
    const result = await this.configRepository.updateUserConfig(key, value);
    return result.length > 0
      ? result.at(0)
      : (await this.configRepository.insertUserConfig(key, value)).at(0);
  }
}

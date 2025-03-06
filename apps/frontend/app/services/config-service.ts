'use client';

import schema from '@/db/drizzle/schema';
import type { CurrencySelect, ForexInsert } from '@/db/drizzle/types';
import { and, between, desc, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import type { FetchFxRate } from '../api/get-latest-fx-rate/route';
import { Service } from './abstract-service';

const { accounts, forex } = schema;

export class ConfigService extends Service {
  protected static instance: ConfigService;

  private constructor() {
    super();
  }

  protected static async createInstance(): Promise<ConfigService> {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }

    return ConfigService.instance;
  }

  public async getAllCurrencies() {
    return await this.drizzle.query.currencies.findMany();
  }

  public async getCurrencyByCode(code: string) {
    return await this.drizzle.query.currencies.findFirst({
      where: (currency, { eq }) => eq(currency.code, code),
    });
  }

  public async getDefaultCurrency() {
    const defaultCurrency = await this.drizzle.query.information.findFirst({
      where: (information, { eq }) => eq(information.name, 'defaultCurrency'),
    });

    return await this.getCurrencyByCode(defaultCurrency?.value ?? 'USD');
  }

  public async getAllCountries() {
    return await this.drizzle.query.countries.findMany();
  }

  public async getCountriesByCode(countryCode: string[]) {
    return await this.drizzle.query.countries.findMany({
      where: ({ code }, { inArray }) => inArray(code, countryCode),
    });
  }

  public async getCountriesInUse() {
    const inUseCountryId = await this.drizzle
      .select({
        countryId: accounts.countryId,
      })
      .from(accounts)
      .groupBy(accounts.countryId);

    return await this.drizzle.query.countries.findMany({
      where: ({ id }, { inArray }) =>
        inArray(
          id,
          inUseCountryId.map((e) => e.countryId),
        ),
      with: {
        defaultCurrency: true,
      },
    });
  }

  public async getCurrenciesInUse() {
    const inUseCurrencyId = await this.drizzle
      .select({
        currencyId: accounts.currencyId,
      })
      .from(accounts)
      .groupBy(accounts.currencyId);

    return await this.drizzle.query.currencies.findMany({
      where: ({ id, code }, { inArray, or, eq }) =>
        or(
          inArray(
            id,
            inUseCurrencyId.map((e) => e.currencyId),
          ),
          eq(code, 'USD'), // Widely used
        ),
    });
  }

  public async getLatestFxRate(baseCurrency: CurrencySelect, targetCurrencies: CurrencySelect[]) {
    const targetCurrencyCodes = targetCurrencies.map((currency) => currency.code);

    const now = DateTime.now();
    const fourHourBefore = now.minus({ hours: 4 });

    let fxRates = await this.drizzle
      .selectDistinctOn([forex.baseCurrency, forex.targetCurrency])
      .from(forex)
      .where(
        and(
          eq(forex.baseCurrency, baseCurrency.code),
          inArray(forex.targetCurrency, targetCurrencyCodes),
          between(forex.createAt, fourHourBefore.toJSDate(), now.toJSDate()),
        ),
      )
      .orderBy(forex.baseCurrency, forex.targetCurrency, desc(forex.createAt));

    if (
      fxRates.length > 0 &&
      fxRates.every((rate) => targetCurrencyCodes.includes(rate.targetCurrency))
    ) {
      return fxRates;
    }

    const params = new URLSearchParams({
      baseCurrency: baseCurrency.code,
      targetCurrency: targetCurrencyCodes.join(','),
    });

    const fetchedFxRates: FetchFxRate = await (
      await fetch(`/api/get-latest-fx-rate?${params.toString()}`, { method: 'GET' })
    ).json();

    const insertObj: ForexInsert[] = Object.entries(fetchedFxRates.rates).map(([key, value]) => ({
      date: fetchedFxRates.date,
      baseCurrency: baseCurrency.code,
      targetCurrency: key,
      rate: value.toFixed(5),
    }));
    fxRates = await this.drizzle.insert(forex).values(insertObj).returning();

    return fxRates;
  }
}

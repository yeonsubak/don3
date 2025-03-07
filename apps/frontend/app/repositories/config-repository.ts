import type { CurrencySelect, ForexInsert } from '@/db/drizzle/types';
import { Repository } from './abstract-repository';
import { accounts, forex } from '@/db/drizzle/schema';
import { DateTime } from 'luxon';
import { and, between, desc, eq, inArray } from 'drizzle-orm';
import type { FetchFxRate } from '../api/get-latest-fx-rate/route';

export const USER_CONFIG_KEYS = ['defaultCurrency', 'defaultLanguage'] as const;
export type UserConfigKey = (typeof USER_CONFIG_KEYS)[number];

export class ConfigRepository extends Repository {
  protected static instance: ConfigRepository;

  private constructor() {
    super();
  }

  protected static async createInstance(): Promise<ConfigRepository> {
    if (!ConfigRepository.instance) {
      ConfigRepository.instance = new ConfigRepository();
    }

    return ConfigRepository.instance;
  }

  public async getAllCurrencies() {
    return await this.db.query.currencies.findMany();
  }

  public async getCurrencyByCode(code: string) {
    return await this.db.query.currencies.findFirst({
      where: (currency, { eq }) => eq(currency.code, code),
    });
  }

  public async getUserConfig(key: UserConfigKey) {
    return await this.db.query.information.findFirst({
      where: (information, { eq }) => eq(information.name, key),
    });
  }

  public async getAllCountries() {
    return await this.db.query.countries.findMany();
  }

  public async getCountryByCode(countryCodes: string) {
    return await this.db.query.countries.findFirst({
      where: ({ code }, { eq }) => eq(code, countryCodes),
    });
  }

  public async getCountriesByCode(countryCodes: string[]) {
    return await this.db.query.countries.findMany({
      where: ({ code }, { inArray }) => inArray(code, countryCodes),
    });
  }

  public async getCountriesInUse() {
    const inUseCountryId = await this.db
      .select({
        countryId: accounts.countryId,
      })
      .from(accounts)
      .groupBy(accounts.countryId);

    return await this.db.query.countries.findMany({
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
    const inUseCurrencyId = await this.db
      .select({
        currencyId: accounts.currencyId,
      })
      .from(accounts)
      .groupBy(accounts.currencyId);

    return await this.db.query.currencies.findMany({
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

  public async getLatestFxRate({
    baseCurrency,
    targetCurrencies,
    timeRange,
  }: {
    baseCurrency: CurrencySelect;
    targetCurrencies: CurrencySelect[];
    timeRange: { start: DateTime; end: DateTime };
  }) {
    const targetCurrencyCodes = targetCurrencies.map((currency) => currency.code);

    return await this.db
      .selectDistinctOn([forex.baseCurrency, forex.targetCurrency])
      .from(forex)
      .where(
        and(
          eq(forex.baseCurrency, baseCurrency.code),
          inArray(forex.targetCurrency, targetCurrencyCodes),
          between(forex.createAt, timeRange.start.toJSDate(), timeRange.end.toJSDate()),
        ),
      )
      .orderBy(forex.baseCurrency, forex.targetCurrency, desc(forex.createAt));
  }

  public async insertFxRate(inserts: ForexInsert[]) {
    return await this.db.insert(forex).values(inserts).returning();
  }
}

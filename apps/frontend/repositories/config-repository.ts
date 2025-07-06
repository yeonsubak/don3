import type {
  AppSchema,
  CountrySelect,
  CurrencySelect,
  ForexInsert,
} from '@/db/app-db/drizzle-types';
import { accounts, forex, information, type UserConfigKey } from '@/db/app-db/schema';
import { and, between, desc, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { Repository } from './abstract-repository';
import { writeOpLog } from './repository-decorators';

export class ConfigRepository extends Repository<AppSchema> {
  public async getAllCurrencies() {
    return await this.db.query.currencies.findMany();
  }

  public async getCurrencyByCode(code: string) {
    return await this.db.query.currencies.findFirst({
      where: (currency, { eq }) => eq(currency.code, code),
    });
  }

  public async getAllCountries() {
    return await this.db.query.countries.findMany({
      with: {
        defaultCurrency: true,
      },
    });
  }

  public async getCountryByCode(countryCode: string) {
    return await this.db.query.countries.findFirst({
      where: ({ code }, { eq }) => eq(code, countryCode),
    });
  }

  public async getCountriesByCode(countryCodes: string[]) {
    return await this.db.query.countries.findMany({
      where: ({ code }, { inArray }) => inArray(code, countryCodes),
    });
  }

  public async getContriesInUse(): Promise<CountrySelect[]> {
    const countryIds = await this.db
      .selectDistinctOn([accounts.countryId], { countryId: accounts.countryId })
      .from(accounts);
    return await this.db.query.countries.findMany({
      where: ({ id }, { inArray }) =>
        inArray(
          id,
          countryIds.flatMap((row) => row.countryId),
        ),
    });
  }

  public async getUserConfig(key: UserConfigKey) {
    return await this.db.query.information.findFirst({
      where: (information, { eq }) => eq(information.name, key),
    });
  }

  @writeOpLog
  public insertUserConfig(key: UserConfigKey, value: string) {
    return this.db
      .insert(information)
      .values({ id: crypto.randomUUID(), name: key, value })
      .returning();
  }

  @writeOpLog
  public updateUserConfig(key: UserConfigKey, value: string) {
    return this.db.update(information).set({ value }).where(eq(information.name, key)).returning();
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

  public async insertFxRate(data: ForexInsert[]) {
    data = data.map((insert) => ({ id: crypto.randomUUID(), ...insert }));
    return await this.db.insert(forex).values(data).returning();
  }
}

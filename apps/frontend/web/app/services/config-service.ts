import { accounts } from '@/db/drizzle/schema';
import type { PgliteDrizzle } from '@/db/pglite-web-worker';
import { Service } from './service-primitive';

export class ConfigService extends Service {
  constructor(drizzle: PgliteDrizzle) {
    super(drizzle);
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
}

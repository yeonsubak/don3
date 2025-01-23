'use client';

import { AccountsService } from '@/app/services/accounts-service';
import { ConfigService } from '@/app/services/config-service';
import { DemoService } from '@/app/services/demo-service';
import { PgliteDrizzle } from '@/db/pglite-drizzle';
import { queryOptions } from '@tanstack/react-query';

const getConfigService = async () => new ConfigService(await PgliteDrizzle.getInstance());
const getAccountsService = async () => new AccountsService(await PgliteDrizzle.getInstance());

export const QUERIES = {
  countriesInUse: queryOptions({
    queryKey: ['countriesInUse'],
    queryFn: async () => await (await getConfigService()).getCountriesInUse(),
  }),
  currenciesInUse: queryOptions({
    queryKey: ['currenciesInUse'],
    queryFn: async () => await (await getConfigService()).getCurrenciesInUse(),
  }),
  initializeIndexedDb: queryOptions({
    queryKey: ['initializeIndexedDb'],
    queryFn: async () => {
      try {
        const drizzle = await PgliteDrizzle.getInstance();
        const demoService = new DemoService(drizzle);
        await demoService.initializeDemoData();
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
  }),
  currencies: queryOptions({
    queryKey: ['currencies'],
    queryFn: async () => await (await getConfigService()).getAllCurrencies(),
  }),
  defaultCurrency: queryOptions({
    queryKey: ['defaultCurrency'],
    queryFn: async () => await (await getConfigService()).getDefaultCurrency(),
  }),
  assetGroupsByCountry: queryOptions({
    queryKey: ['assetGroupsByCountry'],
    queryFn: async () => await (await getAccountsService()).getAcountsByCountry('asset'),
  }),
  expenseGroupsByCountry: queryOptions({
    queryKey: ['expenseGroupsByCountry'],
    queryFn: async () => await (await getAccountsService()).getAcountsByCountry('expense'),
  }),
};

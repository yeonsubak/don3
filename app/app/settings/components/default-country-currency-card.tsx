'use client';

import { CountryCombobox } from '@/components/compositions/country-combobox';
import { CurrencyCombobox } from '@/components/compositions/currency-combobox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { UserConfigKey } from '@/db/app-db/schema';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getConfigService } from '@/services/service-helpers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useGlobalContext } from '../../global-context';

const updateUserConfig = async ({ key, value }: { key: UserConfigKey; value: string }) => {
  const configService = await getConfigService();
  return configService.upsertUserConfig(key, value);
};

export const DefaultCountryCurrencyCard = () => {
  const {
    currencies,
    currenciesInUse,
    countries,
    countriesInUse,
    defaultCountry,
    defaultCurrency,
  } = useGlobalContext();

  const country = useMemo(() => defaultCountry.code, [defaultCountry.code]);
  const currency = useMemo(() => defaultCurrency.code, [defaultCurrency.code]);

  const queryClient = useQueryClient();

  const configMutation = useMutation({
    mutationKey: ['userConfig', 'update'],
    mutationFn: updateUserConfig,
    onSuccess: async (_data, variables) => {
      const { key, value } = variables;

      if (key === 'defaultCountry') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY, value);
      }

      if (key === 'defaultCurrency') {
        localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY, value);
      }

      await queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Country & Currency</CardTitle>
        <CardDescription>
          These values are used as the base for calculations across various components.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Label>Country</Label>
        <CountryCombobox
          countries={countries}
          countriesInUse={countriesInUse}
          mode="all"
          value={country}
          onSelectFn={(value) => configMutation.mutate({ key: 'defaultCountry', value })}
        />
        <Label>Currency</Label>
        <CurrencyCombobox
          currencies={currencies}
          currenciesInUse={currenciesInUse}
          value={currency}
          onSelectFn={(value) => configMutation.mutate({ key: 'defaultCurrency', value })}
        />
      </CardContent>
    </Card>
  );
};

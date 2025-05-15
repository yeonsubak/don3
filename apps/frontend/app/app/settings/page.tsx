'use client';

import { CountryCombobox } from '@/components/compositions/country-combobox';
import { CurrencyCombobox } from '@/components/compositions/currency-combobox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { UserConfigKey } from '@/db/drizzle/schema';
import { getConfigService } from '@/services/helper';
import { useState } from 'react';
import { useGlobalContext } from '../global-context';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

export default function SettingsPage() {
  const {
    currencies,
    currenciesInUse,
    countries,
    countriesInUse,
    defaultCountry,
    defaultCurrency,
  } = useGlobalContext();

  const [country, setCountry] = useState<string>(defaultCountry.code);
  const [currency, setCurrency] = useState<string>(defaultCurrency.code);

  const handleConfigChange = async (key: UserConfigKey, value: string) => {
    const configService = await getConfigService();
    const result = await configService.updateUserConfig(key, value);
    if (key === 'defaultCountry') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY, value);
    }

    if (key === 'defaultCurrency') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY, value);
    }
  };

  return (
    <div className="w-full xl:max-w-lg">
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
            state={[country, setCountry]}
            onSelectFn={(value) => handleConfigChange('defaultCountry', value)}
          />
          <Label>Currency</Label>
          <CurrencyCombobox
            currencies={currencies}
            currenciesInUse={currenciesInUse}
            state={[currency, setCurrency]}
            onSelectFn={(value) => handleConfigChange('defaultCurrency', value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

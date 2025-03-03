import { Combobox } from '@/components/primitives/combobox';
import { MoneyInput } from '@/components/primitives/money-input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useWatch, type FieldValue, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { useTransactionDrawerContext } from '../drawer-context';
import type { CountrySelect, CurrencySelect } from '@/db/drizzle/types';
import { useGlobalContext } from '@/app/app/global-context';
import { Label } from '@/components/ui/label';
import { parseMoney, parseNumber } from '@/components/common-functions';

type AmountCurrencyFieldProps = {
  amountFieldName: string;
  currencyFieldName: string;
  fxRateFieldName: string;
  fxAmountFieldName: string;
  isFxFieldName: string;
  zForm?: UseFormReturn<FieldValue<FieldValues>>;
  setFxRateOpen?: Dispatch<SetStateAction<boolean>>;
};

export const AmountCurrencyField = ({
  currencyFieldName,
  amountFieldName,
  fxRateFieldName,
  fxAmountFieldName,
  isFxFieldName,
  zForm,
}: AmountCurrencyFieldProps) => {
  const { countries } = useGlobalContext();
  const { currencyComboItems, currencies } = useTransactionDrawerContext();
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencySelect>();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencySelect>();
  const [selectedCountry, setSelectedCountry] = useState<CountrySelect>();

  const currencyCodeWatch = useWatch({ control: zForm?.control, name: 'currencyCode' });
  useEffect(() => {
    setSelectedCurrency(currencies.find((currency) => currency.code === currencyCodeWatch));
  }, [currencyCodeWatch, currencies]);

  const countryCodeWatch = useWatch({ control: zForm?.control, name: 'countryCode' });
  useEffect(() => {
    const country = countries.find((country) => country.code === countryCodeWatch);
    setSelectedCountry(country);
    setDefaultCurrency(currencies.find((currency) => currency.id === country?.defaultCurrencyId));
  }, [countryCodeWatch, countries, currencies]);

  const isFxRateOpen = useMemo<boolean>(() => {
    const result = selectedCurrency?.id !== selectedCountry?.defaultCurrencyId;
    if (result) {
      zForm?.setValue(isFxFieldName, true);
    }
    return result;
  }, [selectedCurrency, selectedCountry]);

  return (
    <>
      <FormLabel>Amount</FormLabel>
      <div className="flex flex-row gap-3">
        <FormField
          control={zForm?.control}
          name={currencyFieldName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Combobox
                  items={currencyComboItems}
                  field={field}
                  zForm={zForm}
                  buttenLabelRenderFn={() => {
                    const currency = currencyComboItems.find(
                      (currency) => currency.value === field.value,
                    );
                    return currency?.label.split('-').map((e) => e.trim())[0] ?? '';
                  }}
                  isChevron={false}
                  popoverButtonClass="min-w-[3.25rem] w-fit justify-center"
                  popoverContentClass="w-80"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={zForm?.control}
          name={amountFieldName}
          render={({ field }) => (
            <FormItem className="grow self-end">
              <FormControl>
                <MoneyInput
                  currency={selectedCurrency!}
                  placeholder={`0${(selectedCurrency?.isoDigits ?? 0 > 0) ? '.'.padEnd((selectedCurrency?.isoDigits ?? 0) + 1, '0') : ''}`}
                  field={field}
                  zForm={zForm}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {isFxRateOpen && defaultCurrency ? (
        <FxField
          zForm={zForm}
          baseCurrency={defaultCurrency}
          targetCurrency={selectedCurrency!}
          fxRateFieldName={fxRateFieldName}
          amountFieldName={amountFieldName}
          fxAmountFieldName={fxAmountFieldName}
        />
      ) : (
        <></>
      )}
    </>
  );
};

type FxFieldProps = {
  baseCurrency: CurrencySelect;
  targetCurrency: CurrencySelect;
} & Partial<AmountCurrencyFieldProps>;

const FxField = ({
  zForm,
  baseCurrency,
  targetCurrency,
  fxRateFieldName,
  fxAmountFieldName,
  amountFieldName,
}: FxFieldProps) => {
  const amountWatch: string = useWatch({ control: zForm?.control, name: amountFieldName! });
  const fxRateWatch: string = useWatch({ control: zForm?.control, name: fxRateFieldName! });
  const inversedFxRate = useMemo(() => {
    const inversed = 1 / (parseNumber(fxRateWatch, 10) ?? 0);
    const digits = inversed > 1 ? 2 : 10;
    return inversed.toFixed(digits);
  }, [fxRateWatch]);

  const exchange = (rate: string) => {
    const exchangeRate = parseNumber(rate, 10) ?? 0;
    const amount = parseNumber(amountWatch, baseCurrency.isoDigits) ?? 0;
    const exchanged = amount * exchangeRate;
    return parseMoney(exchanged.toFixed(baseCurrency.isoDigits), baseCurrency);
  };

  useEffect(() => {
    const { formatted } = exchange(fxRateWatch);
    zForm?.setValue(fxAmountFieldName!, formatted);
  }, [amountWatch, fxRateWatch]);

  const isInverseFxRateFinite = useMemo(
    () => Number.isFinite(Number(inversedFxRate)),
    [inversedFxRate],
  );

  return (
    <div className="flex flex-row gap-3">
      <div className="basis-1/2">
        <FormLabel>Exchange Rate</FormLabel>
        <FormField
          control={zForm?.control}
          name={fxRateFieldName!}
          render={({ field }) => {
            const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
              field.onChange(event);
              const { formatted } = exchange(event.target.value);
              zForm?.setValue(fxAmountFieldName!, formatted);
            };
            return (
              <FormItem>
                <FormControl>
                  <Input
                    type="text"
                    variant="ghost"
                    inputMode="decimal"
                    className="text-right"
                    {...field}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormDescription>
                  <span className={isInverseFxRateFinite ? '' : 'invisible'}>
                    1 {baseCurrency.code} = {inversedFxRate} {targetCurrency.code}
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
      <div className="basis-1/2">
        <FormLabel>Converted Amount</FormLabel>
        <FormField
          control={zForm?.control}
          name={fxAmountFieldName!}
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <div className="flex flex-row items-center gap-1">
                    <span>{baseCurrency.symbol}</span>
                    <MoneyInput currency={baseCurrency} field={field} zForm={zForm} readOnly />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
};

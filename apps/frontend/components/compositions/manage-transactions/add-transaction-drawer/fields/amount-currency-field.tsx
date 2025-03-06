import { useGlobalContext } from '@/app/app/global-context';
import { parseMoney, parseNumber } from '@/components/common-functions';
import { Combobox } from '@/components/primitives/combobox';
import { MoneyInput } from '@/components/primitives/money-input';
import { SkeletonSimple } from '@/components/primitives/skeleton-simple';
import { QUERIES } from '@/components/tanstack-queries';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CountrySelect, CurrencySelect } from '@/db/drizzle/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useWatch } from 'react-hook-form';
import { useTransactionDrawerContext } from '../drawer-context';
import type { Form } from '../forms/common';

type AmountCurrencyFieldProps = {
  amountFieldName: string;
  currencyFieldName: string;
  fxRateFieldName: string;
  fxAmountFieldName: string;
  isFxFieldName: string;
  zForm?: Form;
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
                  buttonLabelRenderFn={() => {
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
  mode?: 'normal' | 'inverse';
} & Partial<AmountCurrencyFieldProps>;

const FxField = ({
  zForm,
  baseCurrency,
  targetCurrency,
  fxRateFieldName,
  fxAmountFieldName,
  amountFieldName,
  mode = 'normal',
}: FxFieldProps) => {
  const {
    data: fetchedFxRate,
    isPending,
    isError,
    error,
  } = useQuery(QUERIES.config.getLatestFxRate(targetCurrency, [baseCurrency]));
  useEffect(() => {
    if (!fetchedFxRate) return;

    const [{ rate }] = fetchedFxRate;
    const parsedRate = parseNumber(rate, 5) ?? 1;
    const normalized = parsedRate.toFixed(parsedRate >= 1 ? 2 : 5);
    zForm?.setValue(fxRateFieldName!, normalized);
  }, [fetchedFxRate, baseCurrency, targetCurrency]);

  const amountWatch: string = useWatch({ control: zForm?.control, name: amountFieldName! });
  const fxRateWatch: string = useWatch({ control: zForm?.control, name: fxRateFieldName! });
  const inversedFxRate = useMemo(() => {
    const inversed =
      mode === 'normal'
        ? 1 / (parseNumber(fxRateWatch, 10) ?? 0)
        : (parseNumber(fxRateWatch, 10) ?? 0);
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

  if (isPending) return <SkeletonSimple heightInPx={20} />;

  if (isError) return <p>Error: ${error.message}</p>;

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

export const TransferAmountCurrencyField = ({
  currencyFieldName,
  amountFieldName,
  fxRateFieldName,
  fxAmountFieldName,
  zForm,
}: AmountCurrencyFieldProps) => {
  const { accounts } = useGlobalContext();
  const { currencyComboItems } = useTransactionDrawerContext();
  const [debitCurrency, setDebitCurrency] = useState<CurrencySelect>();
  const [creditCurrency, setCreditCurrency] = useState<CurrencySelect>();

  const debitAccountWatch = useWatch({ control: zForm?.control, name: 'debitAccountId' });
  useEffect(() => {
    const debitAccount = accounts.find(({ id }) => id === parseInt(debitAccountWatch));
    if (debitAccount) {
      setDebitCurrency(debitAccount?.currency);
    }
  }, [accounts, debitAccountWatch]);

  const creditAccountWatch = useWatch({ control: zForm?.control, name: 'creditAccountId' });
  useEffect(() => {
    const creditAccount = accounts.find(({ id }) => id === Number(creditAccountWatch));
    if (creditAccount) {
      setCreditCurrency(creditAccount.currency);
    }

    const isFx =
      [debitCurrency, creditAccount].every((value) => !!value) &&
      debitCurrency?.id !== creditAccount?.currency?.id;
    zForm?.setValue('isFx', isFx);
    zForm?.setValue('currencyCode', creditAccount?.currency?.code);
  }, [accounts, creditAccountWatch, debitCurrency]);

  const isFxWatch = useWatch({ control: zForm?.control, name: 'isFx' });
  const isFxRateOpen = useMemo<boolean>(() => isFxWatch, [isFxWatch]);

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
                  buttonLabelRenderFn={() => {
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
                  currency={debitCurrency!}
                  placeholder={`0${(debitCurrency?.isoDigits ?? 0 > 0) ? '.'.padEnd((debitCurrency?.isoDigits ?? 0) + 1, '0') : ''}`}
                  field={field}
                  zForm={zForm}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {isFxRateOpen ? (
        <FxField
          zForm={zForm}
          baseCurrency={debitCurrency!}
          targetCurrency={creditCurrency!}
          fxRateFieldName={fxRateFieldName}
          amountFieldName={amountFieldName}
          fxAmountFieldName={fxAmountFieldName}
          mode="inverse"
        />
      ) : (
        <></>
      )}
    </>
  );
};

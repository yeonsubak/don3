import { useGlobalContext } from '@/app/app/global-context';
import { parseMoney, parseNumber } from '@/components/common-functions';
import { CurrencyCombobox } from '@/components/compositions/currency-combobox';
import { MoneyInput } from '@/components/primitives/money-input';
import { Skeleton } from '@/components/primitives/skeleton';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CurrencySelect } from '@/db/drizzle/types';
import { QUERIES } from '@/lib/tanstack-queries';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';
import { useWatch } from 'react-hook-form';
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
  const { countries, currencies, currenciesInUse } = useGlobalContext();

  const currencyCodeWatch = useWatch({ control: zForm?.control, name: 'currencyCode' });
  const countryCodeWatch = useWatch({ control: zForm?.control, name: 'countryCode' });

  const selectedCurrency = useMemo(
    () => currencies.find((currency) => currency.code === currencyCodeWatch),
    [currencyCodeWatch, currencies],
  );
  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCodeWatch),
    [countryCodeWatch, countries],
  );
  const defaultCurrency = useMemo(
    () => currencies.find((currency) => currency.id === selectedCountry?.defaultCurrencyId),
    [selectedCountry, currencies],
  );

  const isFxRateOpen = useMemo(
    () => selectedCurrency?.id !== selectedCountry?.defaultCurrencyId,
    [selectedCurrency, selectedCountry],
  );

  const setValueRef = useRef(zForm?.setValue);
  const getValuesRef = useRef(zForm?.getValues);

  useEffect(() => {
    setValueRef.current = zForm?.setValue;
    getValuesRef.current = zForm?.getValues;
  }, [zForm]);

  useEffect(() => {
    if (isFxRateOpen) {
      setValueRef.current?.(isFxFieldName, true);
    }
  }, [isFxRateOpen, isFxFieldName]);

  useEffect(() => {
    if (!isFxRateOpen || !selectedCurrency || !selectedCountry) return;

    const isDiff = selectedCurrency.id !== selectedCountry.defaultCurrencyId;
    const curVal = getValuesRef.current?.(isFxFieldName);
    if (isDiff !== curVal) {
      setValueRef.current?.(isFxFieldName, isDiff);
    }
  }, [selectedCurrency, selectedCountry, isFxRateOpen, isFxFieldName]);

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
                <CurrencyCombobox
                  currencies={currencies}
                  currenciesInUse={currenciesInUse}
                  field={field}
                  buttonRenderMode="symbol"
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
  } = useQuery(QUERIES.config.latestFxRate(targetCurrency, [baseCurrency]));

  const setValueRef = useRef(zForm?.setValue);
  const getValuesRef = useRef(zForm?.getValues);

  useEffect(() => {
    if (!fetchedFxRate || !fxRateFieldName) return;

    const [{ rate }] = fetchedFxRate;
    const parsedRate = parseNumber(rate, 5) ?? 1;
    const normalized = parsedRate.toFixed(parsedRate >= 1 ? 2 : 5);

    if (getValuesRef.current?.(fxRateFieldName) !== normalized) {
      setValueRef.current?.(fxRateFieldName, normalized);
    }
  }, [fetchedFxRate, fxRateFieldName]);

  const amountWatch: string = useWatch({ control: zForm?.control, name: amountFieldName! });
  const fxRateWatch: string = useWatch({ control: zForm?.control, name: fxRateFieldName! });
  const inversedFxRate = useMemo(() => {
    const inversed =
      mode === 'normal'
        ? 1 / (parseNumber(fxRateWatch, 10) ?? 0)
        : (parseNumber(fxRateWatch, 10) ?? 0);
    const digits = inversed > 1 ? 2 : 10;
    return inversed.toFixed(digits);
  }, [fxRateWatch, mode]);

  const exchange = useCallback(
    (rate: string) => {
      const exchangeRate = parseNumber(rate, 10) ?? 0;
      const amount = parseNumber(amountWatch, baseCurrency.isoDigits) ?? 0;
      const exchanged = amount * exchangeRate;
      return parseMoney(exchanged.toFixed(baseCurrency.isoDigits), baseCurrency);
    },
    [amountWatch, baseCurrency],
  );

  useEffect(() => {
    const { formatted } = exchange(fxRateWatch);
    setValueRef.current?.(fxAmountFieldName!, formatted);
  }, [amountWatch, fxRateWatch, exchange, fxAmountFieldName]);

  const isInverseFxRateFinite = useMemo(
    () => Number.isFinite(Number(inversedFxRate)),
    [inversedFxRate],
  );

  if (isPending) return <LoadingSkeleton />;

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
  const { accounts, currencies, currenciesInUse } = useGlobalContext();

  const debitAccountWatch = useWatch({ control: zForm?.control, name: 'debitAccountId' });
  const creditAccountWatch = useWatch({ control: zForm?.control, name: 'creditAccountId' });

  const debitCurrency = useMemo(() => {
    const debitAccount = accounts.find(({ id }) => id === parseInt(debitAccountWatch));
    return debitAccount?.currency;
  }, [accounts, debitAccountWatch]);
  const creditCurrency = useMemo(() => {
    const creditAccount = accounts.find(({ id }) => id === Number(creditAccountWatch));
    return creditAccount?.currency;
  }, [accounts, creditAccountWatch]);

  const isFxRateOpen = useMemo(
    () => debitCurrency && creditCurrency && debitCurrency.id !== creditCurrency.id,
    [debitCurrency, creditCurrency],
  );

  const setValueRef = useRef(zForm?.setValue);

  useEffect(() => {
    setValueRef.current?.('isFx', isFxRateOpen);
    if (creditCurrency) {
      setValueRef.current?.('currencyCode', creditCurrency.code);
    }
  }, [isFxRateOpen, creditCurrency]);

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
                <CurrencyCombobox
                  currencies={currencies}
                  currenciesInUse={currenciesInUse}
                  field={field}
                  buttonRenderMode="symbol"
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
        />
      ) : (
        <></>
      )}
    </>
  );
};

const LoadingSkeleton = () => (
  <div className="flex flex-row gap-3">
    <div className="basis-1/2">
      <label className="leading-none">
        <Skeleton className="w-[104px] max-w-full" />
      </label>
      <div className="space-y-2">
        <div className="focus-visible:border-ring aria-invalid:border-destructive flex h-9 w-full min-w-0 border-b border-black px-3 py-1 text-right transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0"></div>
        <p>
          <span>
            <Skeleton className="w-[192px] max-w-full" />
          </span>
        </p>
      </div>
    </div>
    <div className="basis-1/2">
      <label className="leading-none">
        <Skeleton className="w-[128px] max-w-full" />
      </label>
      <div className="space-y-2">
        <div className="flex flex-row items-center gap-1">
          <span>
            <Skeleton className="w-[14px] max-w-full" />
          </span>
          <div className="focus-visible:border-ring aria-invalid:border-destructive flex h-9 w-full min-w-0 border-b border-black px-3 py-1 text-right transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0"></div>
        </div>
      </div>
    </div>
  </div>
);

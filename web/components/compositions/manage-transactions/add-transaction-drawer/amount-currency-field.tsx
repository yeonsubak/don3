import { Combobox } from '@/components/primitives/combobox';
import { MoneyInput } from '@/components/primitives/money-input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { FieldValue, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTransactionDrawerContext } from './drawer-context';

type AmountCurrencyFieldProps = {
  currencyFieldName: string;
  amountFieldName: string;
  zForm?: UseFormReturn<FieldValue<FieldValues>>;
};

export const AmountCurrencyField = ({
  currencyFieldName,
  amountFieldName,
  zForm,
}: AmountCurrencyFieldProps) => {
  const { currencyComboItems, selectedCurrency } = useTransactionDrawerContext();

  return (
    <>
      <FormLabel>Amount</FormLabel>
      <div className="flex flex-row gap-1">
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
    </>
  );
};

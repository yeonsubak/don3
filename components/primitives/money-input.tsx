'use client';

import type { CurrencySelect } from '@/db/drizzle/types';
import { cn } from '@/lib/utils';
import type { ChangeEvent, ComponentProps, Dispatch, SetStateAction } from 'react';
import type {
  ControllerRenderProps,
  FieldValue,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { parseMoney } from '../common-functions';
import { Input } from '../ui/input';

type MoneyInputProps = {
  currency: CurrencySelect;
  placeholder?: string;
  inputState?: [string, Dispatch<SetStateAction<string>>];
  field?: ControllerRenderProps<FieldValue<FieldValues>>;
  zForm?: UseFormReturn<FieldValue<FieldValues>>;
  onChange?: (input: ReturnType<typeof parseMoney>) => void;
};

export const MoneyInput = ({
  currency,
  placeholder,
  inputState,
  field,
  zForm,
  className,
  onChange,
}: MoneyInputProps & ComponentProps<'input'>) => {
  // Validation for conflicting or missing props
  if ((inputState && (field || zForm)) || (field && !zForm) || (zForm && !field)) {
    throw new Error(
      "Invalid prop combination: 'inputState' cannot be passed with 'field' or 'zForm', and 'field' and 'zForm' must be used together.",
    );
  }

  const handleChange = (input: string, onChangeCallback?: (parsedValue: string) => void) => {
    const money = parseMoney(input, currency);
    onChange?.(money);
    if (onChangeCallback) onChangeCallback(money.formatted);
  };

  const _className = cn('text-right', className);

  if (field) {
    const { name, ...restField } = field;

    return (
      <Input
        type="text"
        variant="ghost"
        placeholder={placeholder}
        inputMode="decimal"
        className={_className}
        {...restField}
        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
          handleChange(target.value, (parsedValue) => {
            field.onChange(parsedValue);
          });
        }}
      />
    );
  }

  if (inputState) {
    const [value, setValue] = inputState;
    return (
      <Input
        type="text"
        variant="ghost"
        placeholder={placeholder}
        value={value}
        inputMode="decimal"
        className={_className}
        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
          handleChange(target.value, setValue);
        }}
      />
    );
  }

  throw new Error("Invalid state: Either 'inputState' or 'field' and 'zForm' must be provided.");
};

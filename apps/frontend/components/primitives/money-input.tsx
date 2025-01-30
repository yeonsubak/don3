'use client';

import type { CurrencySelect } from '@/db/drizzle/types';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type {
  ControllerRenderProps,
  FieldValue,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { Input } from '../ui/input';
import type { TailwindClass } from '../common-types';
import { cn } from '@/lib/utils';
import { parseNumber } from '../common-functions';

type MoneyInputProps = {
  currency: CurrencySelect;
  placeholder: string;
  inputState?: [string, Dispatch<SetStateAction<string>>];
  field?: ControllerRenderProps<FieldValue<FieldValues>>;
  zForm?: UseFormReturn<FieldValue<FieldValues>>;
  className?: TailwindClass;
};

export const MoneyInput = ({
  currency,
  placeholder,
  inputState,
  field,
  zForm,
  className,
}: MoneyInputProps) => {
  // Validation for conflicting or missing props
  if ((inputState && (field || zForm)) || (field && !zForm) || (zForm && !field)) {
    throw new Error(
      "Invalid prop combination: 'inputState' cannot be passed with 'field' or 'zForm', and 'field' and 'zForm' must be used together.",
    );
  }

  const parseMoney = (value: string): string => {
    const parsedValue = parseNumber(value, currency.isoDigits);
    if (!parsedValue) return '';

    return Number(parsedValue).toLocaleString();
  };

  const handleChange = (value: string, onChangeCallback?: (parsedValue: string) => void) => {
    const parsedValue = parseMoney(value);
    if (onChangeCallback) onChangeCallback(parsedValue);
  };

  const _className = cn('text-right', className);

  if (field) {
    const { name, ...restField } = field;
    return (
      <Input
        type="text"
        placeholder={placeholder}
        inputMode="numeric"
        className={_className}
        {...restField}
        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
          handleChange(target.value, (parsedValue) => {
            zForm!.setValue(name, parsedValue);
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
        placeholder={placeholder}
        value={value}
        inputMode="numeric"
        className={_className}
        onChange={({ target }: ChangeEvent<HTMLInputElement>) => {
          handleChange(target.value, setValue);
        }}
      />
    );
  }

  throw new Error("Invalid state: Either 'inputState' or 'field' and 'zForm' must be provided.");
};

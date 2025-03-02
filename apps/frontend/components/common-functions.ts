import type { CurrencySelect } from '@/db/drizzle/types';
import { DateTime } from 'luxon';

export const parseNumber = (input: string, digits?: number): number | null => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const formatter = new Intl.NumberFormat(locale);
  const parts = formatter.formatToParts(12345.6);

  const groupSeparator = parts.find((p) => p.type === 'group')?.value || ',';
  const decimalSeparator = parts.find((p) => p.type === 'decimal')?.value || '.';

  // Normalize thousands separators
  let normalizedInput = input.replace(new RegExp(`\\${groupSeparator}`, 'g'), '');

  // Replace decimal separator with a dot for correct parsing
  if (decimalSeparator !== '.') {
    normalizedInput = normalizedInput.replace(decimalSeparator, '.');
  }

  const parsedNumber = parseFloat(normalizedInput);
  if (isNaN(parsedNumber)) {
    return null;
  }

  return parseFloat(parsedNumber.toFixed(digits ?? 0));
};

export const getDecimalSeparator = (locale?: string) => {
  const fmt = new Intl.NumberFormat(locale);
  const parts = fmt.formatToParts(1.1);
  const decimalPart = parts.find((part) => part.type === 'decimal');
  return decimalPart ? decimalPart.value : '.';
};

export const parseMoney = (
  value: string,
  { isoDigits }: CurrencySelect,
): { value: number; formatted: string } => {
  const parsedValue = parseNumber(value, isoDigits);
  if (!parsedValue) return { value: 0, formatted: '' };

  const decimalSeparator = getDecimalSeparator();
  const endWithPoint = value[value.length - 1] === decimalSeparator;

  const result = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: isoDigits,
  }).format(parsedValue);
  return {
    value: parsedValue,
    formatted: endWithPoint ? `${result}${decimalSeparator}` : result,
  };
};

export const getFirstLastDayInMonth = (_date: Date) => {
  const date = DateTime.fromJSDate(_date);
  return {
    firstDate: date.startOf('month').toJSDate(),
    lastDate: date.endOf('month').toJSDate(),
  };
};

export const invisibleCharMd = 'ㅤ';

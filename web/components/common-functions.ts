import { DateTime } from 'luxon';

export const parseNumber = (input: string, digits?: number): number | null => {
  // Check if the input uses comma or period as decimal separator
  const isCommaDecimal = input.includes(',');

  // Remove thousands separators (commas or periods)
  let normalizedInput = input.replace(/[,\.](?=\d{3})/g, '');

  // Adjust for the decimal separator
  if (isCommaDecimal) {
    // If comma is the decimal separator, replace the comma with a period
    normalizedInput = normalizedInput.replace(',', '.');
  }

  // Try parsing the number
  const parsedNumber = parseFloat(normalizedInput);

  if (isNaN(parsedNumber)) {
    return null;
  }

  return parseFloat(parsedNumber.toFixed(digits ?? 0));
};

export const getFirstLastDayInMonth = (_date: Date) => {
  const date = DateTime.fromJSDate(_date);
  return {
    firstDate: date.startOf('month').toJSDate(),
    lastDate: date.endOf('month').toJSDate(),
  };
};

import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from './config';

type StringKeyedObject = Record<string, unknown>;

function mergeMessages<T extends StringKeyedObject>(base: T, override: Partial<T>): T {
  // Create a new object with base properties
  const result: StringKeyedObject = { ...base };

  // Iterate through override keys
  for (const key of Object.keys(override)) {
    const baseValue = result[key];
    const overrideValue = override[key as keyof T];

    // Deep merge for nested objects
    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = mergeMessages(
        baseValue as StringKeyedObject,
        overrideValue as Partial<StringKeyedObject>,
      );
    }
    // Override with new value if it exists
    else if (overrideValue !== undefined) {
      result[key] = overrideValue;
    }
  }

  return result as T;
}

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const defaultMessages = (await import(`./messages/en.json`)).default;
  const userMessages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages: mergeMessages(defaultMessages, userMessages),
  };
});

// import { headers } from 'next/headers';

export type Locale = (typeof locales)[number] | undefined;

export const locales = ['en', 'ko', 'pl'] as const;
export const defaultLocale: Locale = 'en';

export async function getUserLocale() {
  /*
  TODO: Revamp the below code after testing
  const headersList = await headers();
  const locale = headersList.get('accept-language')?.split(',')[0].substring(0, 2);
  return locales.find((e) => e === locale) ?? defaultLocale; 
  */

  return defaultLocale!;
}

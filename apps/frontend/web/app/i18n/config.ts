import { cookies } from 'next/headers';

export type Locale = (typeof locales)[number] | undefined;

export const locales = ['en', 'ko', 'pl'] as const;
export const defaultLocale: Locale = 'en';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: string) {
  (await cookies()).set(COOKIE_NAME, locale);
}

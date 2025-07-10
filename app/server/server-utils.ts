import { cookies } from 'next/headers';

export type CookieStore = Awaited<ReturnType<typeof cookies>>;

export function serializeCookie(cookieStore: CookieStore) {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ValueOf<T> = T[keyof T];

export type DeepValueOf<T> = T extends object
  ? ValueOf<{
      [K in keyof T]: DeepValueOf<T[K]>;
    }>
  : T;

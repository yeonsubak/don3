import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { DeepValueOf } from '@/lib/utils';
import { useLocalStorage as _useLocalStorage } from 'usehooks-ts';

function defaultSerializer<T>(value: T): string {
  return typeof value === 'undefined' ? '' : String(value);
}

function defaultDeserializer<T>(value: string, initialValue: T): T {
  if (typeof initialValue === 'boolean') {
    return (value === 'true') as T;
  }

  return String(value) as unknown as T;
}

export const useLocalStorage = <T = string>(
  key: DeepValueOf<typeof LOCAL_STORAGE_KEYS>,
  initialValue: T,
  options?: {
    serializer?: (value: T) => string;
    deserializer?: (value: string, initialValue?: T) => T;
  },
) => {
  const {
    serializer = (v: T) => defaultSerializer(v),
    deserializer = (v: string) => defaultDeserializer<T>(v, initialValue),
  } = options ?? {};

  const [value, setValue, removeValue] = _useLocalStorage<T>(key, initialValue, {
    serializer,
    deserializer,
  });

  return [value, setValue, removeValue] as const;
};

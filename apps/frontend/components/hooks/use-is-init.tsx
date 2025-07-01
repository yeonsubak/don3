'use client';

import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { useLocalStorage } from 'usehooks-ts';

export const useIsInit = () => {
  const [isInit, setIsInt] = useLocalStorage(LOCAL_STORAGE_KEYS.APP.INITIALIZED, false, {
    deserializer: (value) => value === 'true',
    serializer: (value) => String(value),
  });

  return { isInit, setIsInt } as const;
};

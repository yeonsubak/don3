'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import React, { useEffect } from 'react';
import { useDarkMode } from 'usehooks-ts';

export const DarkModeToggle = ({ ...props }: React.ComponentProps<typeof Button>) => {
  const { isDarkMode, toggle } = useDarkMode({ localStorageKey: LOCAL_STORAGE_KEYS.APP.DARK_MODE });
  const { setTheme } = useTheme();

  function handleToggle() {
    toggle();
  }

  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <Button variant="outline" size="icon" onClick={handleToggle} {...props}>
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle dark mode</span>
    </Button>
  );
};

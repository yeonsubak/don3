'use client';

import type React from 'react';
import { SettingsDrawerContextProvider } from './settings-drawer-context';

export default function SettingsPageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SettingsDrawerContextProvider>{children}</SettingsDrawerContextProvider>;
}

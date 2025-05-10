import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Noto_Color_Emoji } from 'next/font/google';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: 'Don³ — Open Source Budget Tracker',
  description:
    'Free, browser-based budget tracking app with double-entry accounting, multi-currency support, and planned stock & crypto features.',
};

import { ThemeProvider } from '@/components/page/layout/theme-provider';
import './globals.css';

const pretendard = localFont({
  src: 'fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

const notoColorEmoji = Noto_Color_Emoji({
  subsets: ['emoji'],
  weight: ['400'],
  display: 'swap',
  preload: true,
  variable: '--font-noto-color-emoji',
  fallback: ['Pretendard Variable'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${pretendard.variable} ${notoColorEmoji.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute={'class'}
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

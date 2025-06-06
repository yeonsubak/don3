import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Noto_Color_Emoji } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const APP_NAME = 'Don³';
const APP_DEFAULT_TITLE = 'Don³';
const APP_TITLE_TEMPLATE = '%s — Open Source Budget Tracker';
const APP_DESCRIPTION =
  'Free, browser-based budget tracking app with double-entry accounting, multi-currency support, and planned stock & crypto features.';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
    startupImage: '/images/web-app-manifest-1024x1024.png',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
};

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
      <head>
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <link
          rel="icon"
          href="/images/web-app-manifest-192x192.png"
          type="image/png"
          sizes="192x192"
        />
        <link
          rel="icon"
          href="/images/web-app-manifest-512x512.png"
          type="image/png"
          sizes="512x512"
        />
        <link
          rel="icon"
          href="/images/web-app-manifest-1024x1024.png"
          type="image/png"
          sizes="1024x1024"
        />
        <link rel="apple-touch-icon" href="/images/apple-icon.png" sizes="180x180" />
      </head>
      <body className={`${pretendard.variable} ${notoColorEmoji.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Analytics />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

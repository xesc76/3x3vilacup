import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { TOURNAMENT } from '@/lib/constants';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: {
    default: `${TOURNAMENT.name} — ${TOURNAMENT.edition}`,
    template: `%s · ${TOURNAMENT.name}`,
  },
  description: `Horaris, resultats en directe i classificacions del ${TOURNAMENT.name}. ${TOURNAMENT.dateLabel}, ${TOURNAMENT.venue}, ${TOURNAMENT.city}.`,
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}

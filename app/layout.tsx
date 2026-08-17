import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { TOURNAMENT } from '@/lib/constants';

const sans = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const description = `Horaris, resultats en directe i classificacions del ${TOURNAMENT.name}. ${TOURNAMENT.dateLabel}, ${TOURNAMENT.venue}, ${TOURNAMENT.city}.`;

export const metadata: Metadata = {
  title: {
    default: `${TOURNAMENT.name} · ${TOURNAMENT.edition}`,
    template: `%s · ${TOURNAMENT.name}`,
  },
  description,
  openGraph: {
    title: `${TOURNAMENT.name} · ${TOURNAMENT.edition}`,
    description,
    locale: 'ca_ES',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2E0757',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}

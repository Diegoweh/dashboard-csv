import type { Metadata } from 'next';
import { Roboto, Roboto_Mono, Roboto_Condensed } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-roboto',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-roboto-mono',
});

const robotoCond = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-roboto-cond',
});

export const metadata: Metadata = {
  title: 'Proyecta · Meta Ads Intelligence',
  description: 'Dashboard de análisis de Meta Ads con IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${roboto.variable} ${robotoMono.variable} ${robotoCond.variable} font-[family-name:var(--font-roboto)] antialiased`}>
        {children}
      </body>
    </html>
  );
}

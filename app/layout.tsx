import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { SkipLink } from '@/components/SkipLink';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const siteName = "D'Adriana Tienda";
const siteDescription =
  "Cuidado para la piel y el cabello, atención por WhatsApp y tiendas físicas en D'Adriana Tienda.";
const ogImageAlt =
  "D'Adriana Tienda: composición tipográfica con el texto «Belleza para tu piel y tu cabello» sobre fondo crema";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteName} | Belleza para tu piel y tu cabello`,
  description: siteDescription,
  openGraph: {
    title: `${siteName} | Belleza para tu piel y tu cabello`,
    description: siteDescription,
    siteName,
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: ogImageAlt,
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={poppins.variable}>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}

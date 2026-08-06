import type { Metadata } from 'next';
import { Tajawal, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | AGMA OS',
    default: 'AGMA OS',
  },
  description: 'نظام تشغيل وكالة جيل الذكاء الاصطناعي',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} ${ibmPlexSansArabic.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}

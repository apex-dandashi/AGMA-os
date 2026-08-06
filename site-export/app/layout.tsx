import type { Metadata } from 'next';
import { Tajawal, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

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
    template: '%s | AGMA',
    default: 'AGMA.com.sa | وكالة جيل الذكاء الاصطناعي',
  },
  description: 'وكالتك الكاملة في عصر الذكاء الاصطناعي. AGMA هي وكالة سعودية Native-AI مبنية بالذكاء الاصطناعي من الداخل لخدمة العلامات الطموحة والمستقبلية.',
  icons: {
    icon: '/favicon AGMA.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${ibmPlexSansArabic.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-[#0A0A0A] text-[#FAFAFA]" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

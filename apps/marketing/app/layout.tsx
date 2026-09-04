import type { Metadata } from 'next';
import { Tajawal, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import SiteAssistant from '@/components/SiteAssistant';

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
  description: 'تسويق، تصميم، أتمتة: فريق واحد وعقل اصطناعي. AGMA هي وكالة سعودية Native-AI مبنية بالذكاء الاصطناعي من الداخل لخدمة العلامات الطموحة والمستقبلية.',
  icons: {
    icon: '/favicon-agma.webp',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'AGMA',
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${ibmPlexSansArabic.variable}`} suppressHydrationWarning>
      {/* لا خلفية على body: الفضاء (SilkSpace، z -10) يرسم فوق خلفية html
          وتحت المحتوى — خلفية body كانت ستغطيه */}
      <body className="antialiased text-[#FAFAFA]" suppressHydrationWarning>
        <ClientProviders>
          {children}
        </ClientProviders>
        <SiteAssistant />
      </body>
    </html>
  );
}

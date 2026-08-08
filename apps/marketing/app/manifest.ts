import type { MetadataRoute } from 'next';

/** بيان PWA — أيقونة واسم نظيفان عند التثبيت على شاشة الجوال الرئيسية. */
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AGMA — وكالة جيل الذكاء الاصطناعي',
    short_name: 'AGMA',
    description: 'وكالة تسويق سعودية AI-native',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

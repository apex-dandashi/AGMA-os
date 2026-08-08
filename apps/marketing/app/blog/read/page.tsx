import type { Metadata } from 'next';
import { Suspense } from 'react';
import ReadClient from './ReadClient';

/**
 * القارئ الفوري: للمقالات المنشورة بعد آخر بناء ثابت — noindex حتى لا تتكرر
 * الفهرسة؛ النسخة الثابتة /blog/[slug] هي المرجعية (canonical).
 */
export const metadata: Metadata = {
  title: 'مقال — مدونة AGMA',
  robots: { index: false, follow: true },
};

export default function ReadPage() {
  return (
    <Suspense fallback={<main dir="rtl" className="mx-auto max-w-3xl px-4 py-16 text-gray-medium">جارٍ التحميل…</main>}>
      <ReadClient />
    </Suspense>
  );
}

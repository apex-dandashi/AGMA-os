import type { Metadata } from 'next';
import LightClient from './LightClient';

// نسخة المقارنة الفاتحة (جولة الراحة 2026-09-04): لاختبار التفضيل ضد
// الداكنة — غير مفهرسة وغير مربوطة من أي قائمة.
export const metadata: Metadata = {
  title: 'AGMA — النسخة الفاتحة (تجريبية)',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LightClient />;
}

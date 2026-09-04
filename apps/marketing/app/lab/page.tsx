import type { Metadata } from 'next';
import LabClient from './LabClient';

// مختبر الهيرو (2026-09-05): تجربة خلفيات فيديو/حركة مرشحة على نفس هيرو AGMA
// — غير مفهرسة وغير مربوطة من أي قائمة، للمقارنة بالعين قبل أي قرار.
export const metadata: Metadata = {
  title: 'AGMA — مختبر الهيرو (تجريبي)',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <LabClient />;
}

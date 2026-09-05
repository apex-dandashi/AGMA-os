import type { Metadata } from 'next';
import AcceleratorClient from './AcceleratorClient';

// «باقة مسرّع الأعمال Business Accelerator» (2026-09-05): رحلة من الفكرة إلى الأثر يقودها الحرير بشدّته
// الكاملة — الهيكل: فكرة ← دليل ← مسرح الخدمات ← كيف نبدأ ← تواصل.
export const metadata: Metadata = {
  title: 'باقة مسرّع الأعمال Business Accelerator | 9,500 ر.س شهرياً لخمس خدمات متكاملة',
  description:
    'باقة مسرّع الأعمال من AGMA: موقع، هوية، تصوير منتجات، سوشال ميديا، وأنظمة أتمتة بفريق واحد وعقل اصطناعي، 9,500 ر.س شهرياً لمدة سنة بدلاً من 15,000.',
};

export default function Page() {
  return <AcceleratorClient />;
}

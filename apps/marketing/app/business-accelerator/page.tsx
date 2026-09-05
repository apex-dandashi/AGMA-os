import type { Metadata } from 'next';
import AcceleratorClient from './AcceleratorClient';

// «باقة مسرّع الأعمال Business Accelerator» (2026-09-05): رحلة من الفكرة إلى الأثر يقودها الحرير بشدّته
// الكاملة — الهيكل: فكرة ← دليل ← مسرح الخدمات ← كيف نبدأ ← تواصل.
export const metadata: Metadata = {
  title: 'الباقات السنوية: انطلاقة · مسرّع الأعمال · قيادة السوق | باقة تسويق شاملة شهرية',
  description: 'ثلاث باقات سنوية من خدمات AGMA بفريق واحد وسعر شهري ثابت: انطلاقة 3,900، مسرّع الأعمال 9,500، قيادة السوق 17,500 ر.س شهرياً. موقع، هوية، سوشال، أتمتة، إعلانات، سيو ووكيل ذكاء اصطناعي.',
};

export default function Page() {
  return <AcceleratorClient />;
}

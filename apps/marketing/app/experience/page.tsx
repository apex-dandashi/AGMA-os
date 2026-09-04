import type { Metadata } from 'next';
import ExperienceClient from './ExperienceClient';

// «تجربة AGMA» (2026-09-05): رحلة من الفكرة إلى الأثر يقودها الحرير بشدّته
// الكاملة — الهيكل: فكرة ← دليل ← مسرح الخدمات ← كيف نبدأ ← تواصل.
export const metadata: Metadata = {
  title: 'تجربة AGMA — من الفكرة إلى الأثر | باقة متكاملة 9,500 ر.س شهرياً',
  description:
    'رحلة تفاعلية تعرض كيف تحوّل AGMA فكرتك إلى أثر: موقع، هوية، تصوير منتجات، سوشال ميديا، وأنظمة أتمتة في باقة واحدة متكاملة بقيمة 9,500 ر.س شهرياً لمدة سنة.',
};

export default function Page() {
  return <ExperienceClient />;
}

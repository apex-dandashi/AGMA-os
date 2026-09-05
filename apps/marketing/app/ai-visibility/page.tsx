import type { Metadata } from 'next';
import AiVisibilityClient from './AiVisibilityClient';

// «حصة الذكاء» (2026-09-05): أداة مجانية تقيس ظهور العلامة في إجابات محركات
// الذكاء الاصطناعي بالعربية — منتج GEO باسم، يقود إلى باقة «قيادة السوق».
export const metadata: Metadata = {
  title: 'حصة الذكاء: هل يذكرك ChatGPT وGemini حين يسأل عميلك؟ | أداة مجانية',
  description:
    'اكتب اسم علامتك وقطاعك ومدينتك، ونقيس هل تذكرك محركات الذكاء الاصطناعي في أسئلة الشراء الحقيقية، ومن يذكرون من منافسيك. أداة مجانية من AGMA لتحسين الظهور في محركات الذكاء (GEO) بالعربية.',
};

export default function Page() {
  return <AiVisibilityClient />;
}

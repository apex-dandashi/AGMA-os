import { Metadata } from 'next';
import SEOContentClient from './SEOContentClient';

export const metadata: Metadata = {
  title: 'SEO واستراتيجية المحتوى | AGMA',
  description: 'سيو عربي متخصص، محتوى يجذب ويحوّل، واستراتيجيات ظهور مصممة للسوق السعودي ولعصر محركات الذكاء الاصطناعي.',
};

export default function SEOContentPage() {
  return <SEOContentClient />;
}

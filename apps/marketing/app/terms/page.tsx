import { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'الشروط والأحكام | AGMA وكالة جيل الذكاء الاصطناعي',
  description: 'اطّلع على شروط وأحكام استخدام موقع AGMA وتنظيم طلب الخدمات، العروض، الملكية الفكرية، حدود المسؤولية، وخدمات الإعلانات والذكاء الاصطناعي.',
};

export default function TermsPage() {
  return <TermsClient />;
}

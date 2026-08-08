import { Metadata } from 'next';
import CareersClient from './CareersClient';

export const metadata: Metadata = {
  title: 'الوظائف والمواهب | AGMA',
  description:
    'ابنِ معنا وكالة جيل الذكاء الاصطناعي — استعرض الفرص المفتوحة أو انضم إلى شبكة مواهب AGMA.',
};

export default function CareersPage() {
  return <CareersClient />;
}

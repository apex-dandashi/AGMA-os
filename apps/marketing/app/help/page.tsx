import type { Metadata } from 'next';
import HelpClient from './HelpClient';

export const metadata: Metadata = {
  title: 'مركز المساعدة — AGMA',
  description:
    'أجوبة عملية عن التسويق الرقمي في السعودية وطريقة عمل AGMA — ابحث في قاعدة المعرفة أو اسأل مساعدنا الذكي.',
};

export default function Page() {
  return <HelpClient />;
}

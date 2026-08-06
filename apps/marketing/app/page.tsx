import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'AGMA | وكالة جيل الذكاء الاصطناعي',
  description: 'وكالة تسويق سعودية Native-AI متخصصة في الأتمتة والذكاء الاصطناعي والنمو الاستراتيجي لشركات المملكة الواعدة.',
};

export default function Home() {
  return <HomeClient />;
}

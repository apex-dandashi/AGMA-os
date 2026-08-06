import { Metadata } from 'next';
import ServicesClient from './ServicesClient';

export const metadata: Metadata = {
  title: 'خدماتنا | AGMA وكالة جيل الذكاء الاصطناعي',
  description: 'اكتشف خدماتنا المتكاملة في الأتمتة، التسويق الأدائي، السيو، السوشال ميديا، الهوية، والويب.',
};

export default function ServicesPage() {
  return <ServicesClient />;
}

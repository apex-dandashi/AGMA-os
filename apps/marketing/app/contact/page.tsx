import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'تواصل معنا | AGMA وكالة جيل الذكاء الاصطناعي',
  description: 'لنبدأ بناء منظومة نمو أذكى لشركتك. تواصل معنا لطلب عرض سعر أو حجز مكالمة استراتيجية لفهم التحديات واكتشاف الفرص.',
};

export default function ContactPage() {
  return <ContactClient />;
}

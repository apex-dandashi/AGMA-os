import { Metadata } from 'next';
import PrivacyPageClient from './PrivacyPageClient';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | AGMA وكالة جيل الذكاء الاصطناعي',
  description: 'تعرّف على كيفية جمع واستخدام وحماية البيانات الشخصية في موقع AGMA، بما يشمل نماذج التواصل، التحليلات، الإعلانات، وملفات تعريف الارتباط وتوافقها مع نظام حماية البيانات السعودي PDPL.',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPageClient />;
}

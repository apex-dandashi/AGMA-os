import { Metadata } from 'next';
import AIAutomationClient from './AIAutomationClient';

export const metadata: Metadata = {
  title: 'الأتمتة والذكاء الاصطناعي | AGMA',
  description: 'نحن نبني البنية التحتية لجيل جيل الذكاء الاصطناعي — أتمتة مهامك، ذكاء عملياتك، ورفع كفاءة فريقك باستخدام أحدث التقنيات.',
};

export default function AIAutomationPage() {
  return <AIAutomationClient />;
}

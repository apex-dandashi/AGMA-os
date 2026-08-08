import { Metadata } from 'next';
import AuditClient from './AuditClient';

export const metadata: Metadata = {
  title: 'فحص موقعك مجاناً | AGMA',
  description:
    'أدخل رابط موقعك واحصل فوراً على درجة صحته: الأداء، السيو، إمكانية الوصول، وأهم فرص التحسين — مجاناً من AGMA.',
};

export default function WebsiteAuditPage() {
  return <AuditClient />;
}

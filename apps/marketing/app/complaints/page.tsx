import { Metadata } from 'next';
import ComplaintsClient from './ComplaintsClient';

export const metadata: Metadata = {
  title: 'الشكاوى والملاحظات | AGMA',
  description:
    'نتعامل مع كل شكوى بجدية: رقم مرجعي، متابعة، وحل. قدّم شكوى رسمية أو تتبع حالة شكواك لدى AGMA.',
};

export default function ComplaintsPage() {
  return <ComplaintsClient />;
}

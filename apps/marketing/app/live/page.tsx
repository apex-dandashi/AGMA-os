import { Metadata } from 'next';
import LiveClient from './LiveClient';

export const metadata: Metadata = {
  title: 'AGMA Live | ماذا يحدث الآن',
  description:
    'نبض أنظمة AGMA لحظياً: جاهزية المواقع المُدارة، فحوصات الجودة، والأتمتات العاملة — أرقام حقيقية من نظام التشغيل.',
};

export default function LivePage() {
  return <LiveClient />;
}

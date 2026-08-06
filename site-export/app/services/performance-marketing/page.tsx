import { Metadata } from 'next';
import PerformanceMarketingClient from './PerformanceMarketingClient';

export const metadata: Metadata = {
  title: 'التسويق الأدائي والإعلانات المدفوعة | AGMA',
  description: 'حملات مدفوعة، تحسين تحويلات، واستهداف ذكي يعتمد على البيانات — نمو مدفوع بالأرقام، لا بالتخمين.',
};

export default function PerformanceMarketingPage() {
  return <PerformanceMarketingClient />;
}

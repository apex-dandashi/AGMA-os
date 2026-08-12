import AppShell from '../components/AppShell';
import PipelineBoard from '../components/PipelineBoard';
import SalesGuide from '../components/SalesGuide';

export const metadata = { title: 'مسار المبيعات' };

export default function Page() {
  return (
    <AppShell>
      <PipelineBoard />
      <SalesGuide />
    </AppShell>
  );
}

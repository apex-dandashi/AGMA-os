import AppShell from '../components/AppShell';
import PipelineBoard from '../components/PipelineBoard';

export const metadata = { title: 'مسار المبيعات' };

export default function Page() {
  return (
    <AppShell>
      <PipelineBoard />
    </AppShell>
  );
}

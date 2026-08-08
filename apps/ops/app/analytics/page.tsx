import AppShell from '../../components/AppShell';
import AnalyticsPanel from '../../components/AnalyticsPanel';

export const metadata = { title: 'التحليلات' };

export default function Page() {
  return (
    <AppShell>
      <AnalyticsPanel />
    </AppShell>
  );
}

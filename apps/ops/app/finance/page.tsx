import AppShell from '../../components/AppShell';
import FinancePanel from '../../components/FinancePanel';

export const metadata = { title: 'المالية' };

export default function Page() {
  return (
    <AppShell>
      <FinancePanel />
    </AppShell>
  );
}

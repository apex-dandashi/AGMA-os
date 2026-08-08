import AppShell from '../../components/AppShell';
import ImsPanel from '../../components/ImsPanel';

export const metadata = { title: 'الحوكمة والامتثال' };

export default function Page() {
  return (
    <AppShell>
      <ImsPanel />
    </AppShell>
  );
}

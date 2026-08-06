import AppShell from '../../components/AppShell';
import ClientsPanel from '../../components/ClientsPanel';

export const metadata = { title: 'العملاء' };

export default function Page() {
  return (
    <AppShell>
      <ClientsPanel />
    </AppShell>
  );
}

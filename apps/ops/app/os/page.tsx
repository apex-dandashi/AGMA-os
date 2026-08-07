import AppShell from '../../components/AppShell';
import OsPanel from '../../components/OsPanel';

export const metadata = { title: 'نظام التشغيل' };

export default function Page() {
  return (
    <AppShell>
      <OsPanel />
    </AppShell>
  );
}

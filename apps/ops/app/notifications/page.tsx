import AppShell from '../../components/AppShell';
import NotificationsLog from '../../components/NotificationsLog';

export const metadata = { title: 'سجل الإشعارات' };

export default function Page() {
  return (
    <AppShell>
      <NotificationsLog />
    </AppShell>
  );
}

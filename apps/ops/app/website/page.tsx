import AppShell from '../../components/AppShell';
import WebsiteManager from '../../components/WebsiteManager';

export const metadata = { title: 'مزامنة الموقع' };

export default function Page() {
  return (
    <AppShell>
      <WebsiteManager />
    </AppShell>
  );
}

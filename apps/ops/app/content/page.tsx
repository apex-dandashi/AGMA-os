import AppShell from '../../components/AppShell';
import ContentPanel from '../../components/ContentPanel';

export const metadata = { title: 'المحتوى' };

export default function Page() {
  return (
    <AppShell>
      <ContentPanel />
    </AppShell>
  );
}

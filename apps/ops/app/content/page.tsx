import AppShell from '../../components/AppShell';
import ContentTabs from './ContentTabs';

export const metadata = { title: 'المحتوى' };

export default function Page() {
  return (
    <AppShell>
      <ContentTabs />
    </AppShell>
  );
}

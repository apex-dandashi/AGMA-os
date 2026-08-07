import AppShell from '../../components/AppShell';
import DocumentsPanel from '../../components/DocumentsPanel';

export const metadata = { title: 'المستندات' };

export default function Page() {
  return (
    <AppShell>
      <DocumentsPanel />
    </AppShell>
  );
}

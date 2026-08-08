import AppShell from '../../components/AppShell';
import HelpCenter from '../../components/HelpCenter';

export const metadata = { title: 'مركز المساعدة' };

export default function Page() {
  return (
    <AppShell>
      <HelpCenter />
    </AppShell>
  );
}

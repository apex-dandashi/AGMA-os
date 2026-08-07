import AppShell from '../../components/AppShell';
import SettingsPanel from '../../components/SettingsPanel';

export const metadata = { title: 'الإعدادات' };

export default function Page() {
  return (
    <AppShell>
      <SettingsPanel />
    </AppShell>
  );
}

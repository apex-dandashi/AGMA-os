import AppShell from '../../components/AppShell';
import ProfilePanel from '../../components/ProfilePanel';

export const metadata = { title: 'ملفي الشخصي' };

export default function Page() {
  return (
    <AppShell>
      <ProfilePanel />
    </AppShell>
  );
}

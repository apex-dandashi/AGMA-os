import AppShell from '../../components/AppShell';
import TeamPage from '../../components/TeamPage';

export const metadata = { title: 'الفريق' };

export default function Page() {
  return (
    <AppShell>
      <TeamPage />
    </AppShell>
  );
}

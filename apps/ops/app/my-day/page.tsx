import AppShell from '../../components/AppShell';
import MyDayPanel from '../../components/MyDayPanel';

export const metadata = { title: 'يومي' };

export default function Page() {
  return (
    <AppShell>
      <MyDayPanel />
    </AppShell>
  );
}

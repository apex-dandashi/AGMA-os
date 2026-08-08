import AppShell from '../../components/AppShell';
import FormsAdmin from '../../components/FormsAdmin';

export const metadata = { title: 'النماذج' };

export default function Page() {
  return (
    <AppShell>
      <FormsAdmin />
    </AppShell>
  );
}

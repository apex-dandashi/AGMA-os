import AppShell from '../../components/AppShell';
import ChatPanel from '../../components/ChatPanel';

export const metadata = { title: 'الدردشة' };

export default function Page() {
  return (
    <AppShell>
      <ChatPanel />
    </AppShell>
  );
}

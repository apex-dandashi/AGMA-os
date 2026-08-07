import { Suspense } from 'react';
import AppShell from '../../components/AppShell';
import ClientsPanel from '../../components/ClientsPanel';

export const metadata = { title: 'العملاء' };

export default function Page() {
  return (
    <AppShell>
      {/* useSearchParams (deep links) requires a Suspense boundary in static export */}
      <Suspense>
        <ClientsPanel />
      </Suspense>
    </AppShell>
  );
}

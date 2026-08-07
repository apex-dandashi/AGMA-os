import { Suspense } from 'react';
import AppShell from '../../components/AppShell';
import ProjectsPanel from '../../components/ProjectsPanel';

export const metadata = { title: 'المشاريع' };

export default function Page() {
  return (
    <AppShell>
      <Suspense>
        <ProjectsPanel />
      </Suspense>
    </AppShell>
  );
}

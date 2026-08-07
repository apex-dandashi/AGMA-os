'use client';

import { useProfile } from './AppShell';
import TeamPanel from './TeamPanel';

export default function TeamPage() {
  const me = useProfile();
  return <TeamPanel me={me} />;
}

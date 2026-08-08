'use client';

import * as React from 'react';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { Button, Input, Modal, Spinner, ToastProvider } from '@agma/ui';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { installErrorReporting } from '../lib/errorReporting';
import { LocaleProvider, useLocale, type DictKey } from '../lib/i18n';
import { keys } from '../lib/queries';
import MfaGate from './MfaGate';
import ActivitiesBell, { activitiesKey } from './ActivitiesBell';
import NotificationsInbox, { inboxKey } from './NotificationsInbox';

const NAV: { href: string; key: DictKey }[] = [
  { href: '/os/', key: 'nav.os' },
  { href: '/my-day/', key: 'nav.myday' },
  { href: '/', key: 'nav.pipeline' },
  { href: '/projects/', key: 'nav.projects' },
  { href: '/clients/', key: 'nav.clients' },
  { href: '/documents/', key: 'nav.documents' },
  { href: '/finance/', key: 'nav.finance' },
  { href: '/website/', key: 'nav.website' },
  { href: '/team/', key: 'nav.team' },
  { href: '/ims/', key: 'nav.ims' },
  { href: '/settings/', key: 'nav.settings' },
];

const ProfileContext = React.createContext<Tables<'profiles'> | null>(null);

export function useProfile(): Tables<'profiles'> {
  const p = React.useContext(ProfileContext);
  if (!p) throw new Error('useProfile requires AppShell');
  return p;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => installErrorReporting(), []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ToastProvider>
          <AuthGate>{children}</AuthGate>
        </ToastProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Stale session for a deleted/blocked user — never hang on it.
          getSupabase().auth.signOut();
          return;
        }
        setProfile(data);
      });
  }, [session]);

  if (!ready) return <CenterSpinner />;
  if (!session) return <LoginForm />;
  if (!profile) return <CenterSpinner />;
  if (profile.role === 'client') {
    // حسابات العملاء إلى بوابتهم — المرحلة ٧
    if (typeof window !== 'undefined') window.location.replace('/portal/');
    return <CenterSpinner />;
  }

  return (
    <ProfileContext.Provider value={profile}>
      {/* 2FA mandatory for team roles (docs/05 §B11.4) */}
      <MfaGate>
        <Chrome profile={profile}>{children}</Chrome>
      </MfaGate>
    </ProfileContext.Provider>
  );
}

function CenterSpinner() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

/** Invalidate team-shared queries on any realtime change (docs/07 DoD #8). */
function useRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel('ops-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () =>
        qc.invalidateQueries({ queryKey: keys.leads })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () =>
        qc.invalidateQueries({ queryKey: keys.documents })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () =>
        qc.invalidateQueries({ queryKey: activitiesKey as unknown as readonly string[] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () =>
        qc.invalidateQueries({ queryKey: inboxKey as unknown as readonly string[] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

function Chrome({ profile, children }: { profile: Tables<'profiles'>; children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, locale, toggle } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);
  useRealtimeSync();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const navLink = (item: { href: string; key: DictKey }, mobile = false) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={pathname === item.href ? 'page' : undefined}
      className={`rounded-sm transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
        mobile ? 'flex-1 py-2.5 text-center text-xs' : 'px-3 py-1.5 text-sm'
      } ${
        pathname === item.href
          ? 'bg-pulse-orange/15 text-pulse-orange'
          : 'text-gray-light hover:text-snow'
      }`}
    >
      {t(item.key)}
    </Link>
  );

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-pulse-orange focus:px-3 focus:py-1">
        {t('chrome.skip')}
      </a>
      <header className="flex items-center gap-3 border-b border-gray-dark px-4 py-3 md:gap-6 md:px-6">
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="AGMA" className="h-7 w-auto" />
          <span className="font-black text-snow text-sm">OS</span>
        </span>
        <nav aria-label="main" className="hidden gap-1 md:flex">
          {NAV.map((i) => navLink(i))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-sm border border-gray-dark px-3 py-1.5 text-xs text-gray-medium hover:text-gray-light focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none sm:flex"
          >
            {t('chrome.search')} <kbd className="rounded-sm bg-gray-dark px-1.5 font-sans">⌘K</kbd>
          </button>
          <ActivitiesBell />
          <NotificationsInbox />
          <button
            onClick={toggle}
            aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            className="rounded-sm border border-gray-dark px-2 py-1 text-xs text-gray-light hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
          >
            {locale === 'ar' ? 'EN' : 'ع'}
          </button>
          <span className="hidden text-sm text-gray-medium lg:inline">
            {profile.full_name || profile.email}
          </span>
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="rounded-sm text-sm text-gray-medium hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
          >
            {t('chrome.signout')}
          </button>
        </div>
      </header>
      <main id="main" className="p-4 md:p-6">{children}</main>
      {/* Mobile bottom navigation */}
      <nav aria-label="mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-dark bg-pure-ink/95 backdrop-blur md:hidden">
        {NAV.map((i) => navLink(i, true))}
      </nav>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

interface SearchHit {
  kind: 'lead' | 'client' | 'document' | 'project' | 'task';
  id: string;
  label: string;
  sub?: string;
  href: string;
}

function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      setQ('');
      setHits([]);
      return;
    }
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBusy(true);
      const supabase = getSupabase();
      const like = `%${q.trim()}%`;
      const [leads, clients, docs, projects, tasks] = await Promise.all([
        supabase.from('leads').select('id, name, company').or(`name.ilike.${like},company.ilike.${like}`).limit(5),
        supabase.from('clients').select('id, company').ilike('company', like).limit(5),
        supabase.from('documents').select('id, number, type').ilike('number', like).limit(5),
        supabase.from('projects').select('id, name').ilike('name', like).limit(5),
        supabase.from('tasks').select('id, title, project_id').ilike('title', like).limit(5),
      ]);
      setHits([
        ...(clients.data ?? []).map((c): SearchHit => ({
          kind: 'client', id: c.id, label: c.company, href: `/clients/?id=${c.id}`,
        })),
        ...(projects.data ?? []).map((p): SearchHit => ({
          kind: 'project', id: p.id, label: p.name, href: `/projects/?id=${p.id}`,
        })),
        ...(tasks.data ?? []).map((t): SearchHit => ({
          kind: 'task', id: t.id, label: t.title,
          href: t.project_id ? `/projects/?id=${t.project_id}` : '/projects/',
        })),
        ...(leads.data ?? []).map((l): SearchHit => ({
          kind: 'lead', id: l.id, label: l.name, sub: l.company ?? undefined, href: '/',
        })),
        ...(docs.data ?? []).map((d): SearchHit => ({
          kind: 'document', id: d.id, label: d.number ?? d.type, href: '/documents/',
        })),
      ]);
      setBusy(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [q, open]);

  const KIND_AR = {
    lead: 'محتمل', client: 'عميل', document: 'مستند',
    project: 'مشروع', task: 'مهمة',
  } as const;

  return (
    <Modal open={open} onClose={onClose} title={t('search.title')}>
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={t('search.placeholder')} />
      <div className="mt-3 space-y-1">
        {busy && <Spinner />}
        {!busy && q.length >= 2 && hits.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-medium">{t('search.empty')}</p>
        )}
        {hits.map((h) => (
          <button
            key={`${h.kind}-${h.id}`}
            onClick={() => {
              onClose();
              router.push(h.href);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-start text-sm hover:bg-gray-dark/40 focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
          >
            <span className="rounded-full bg-gray-dark px-2 py-0.5 text-xs text-gray-medium">
              {KIND_AR[h.kind]}
            </span>
            <span className="font-medium">{h.label}</span>
            {h.sub && <span className="text-xs text-gray-medium">{h.sub}</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) setError('بيانات الدخول غير صحيحة');
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="AGMA" className="h-9 w-auto" />
          <span className="text-2xl font-black text-snow">OS</span>
        </div>
        <Input type="email" required dir="ltr" label="البريد الإلكتروني"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required dir="ltr" label="كلمة المرور"
          value={password} onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined} />
        <Button type="submit" loading={busy} className="w-full">دخول</Button>
        <Link href="/reset/" className="block text-center text-xs text-gray-medium hover:text-snow">
          نسيت كلمة المرور؟
        </Link>
      </form>
    </div>
  );
}

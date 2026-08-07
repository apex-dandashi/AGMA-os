'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { Button, Input, Modal, Spinner, ToastProvider } from '@agma/ui';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

const NAV = [
  { href: '/', label: 'المسار' },
  { href: '/clients/', label: 'العملاء' },
  { href: '/documents/', label: 'المستندات' },
  { href: '/website/', label: 'الموقع' },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
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
      <ToastProvider>
        <AuthGate>{children}</AuthGate>
      </ToastProvider>
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
      .then(({ data }) => setProfile(data));
  }, [session]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (!session) return <LoginForm />;
  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (profile.role === 'client') {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <p className="mb-4">هذا النظام مخصص لفريق AGMA. حسابك حساب عميل.</p>
          <Button variant="outline" size="sm" onClick={() => getSupabase().auth.signOut()}>
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return <Chrome profile={profile}>{children}</Chrome>;
}

function Chrome({ profile, children }: { profile: Tables<'profiles'>; children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-pulse-orange focus:px-3 focus:py-1"
      >
        تخطي إلى المحتوى
      </a>
      <header className="flex items-center gap-6 border-b border-gray-dark px-6 py-3">
        <span className="font-black text-pulse-orange text-lg">AGMA OS</span>
        <nav aria-label="التنقل الرئيسي" className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`rounded-sm px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                pathname === item.href
                  ? 'bg-pulse-orange/15 text-pulse-orange'
                  : 'text-gray-light hover:text-snow'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setSearchOpen(true)}
          className="ms-auto flex items-center gap-2 rounded-sm border border-gray-dark px-3 py-1.5 text-xs text-gray-medium hover:text-gray-light focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
        >
          بحث… <kbd className="rounded-sm bg-gray-dark px-1.5 font-sans">⌘K</kbd>
        </button>
        <div className="flex items-center gap-3 text-sm text-gray-medium">
          <span>{profile.full_name || profile.email}</span>
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="rounded-sm text-gray-medium hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
          >
            خروج
          </button>
        </div>
      </header>
      <main id="main" className="p-6">{children}</main>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

interface SearchHit {
  kind: 'lead' | 'client' | 'document';
  id: string;
  label: string;
  sub?: string;
  href: string;
}

function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
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
    const t = setTimeout(async () => {
      setBusy(true);
      const supabase = getSupabase();
      const like = `%${q.trim()}%`;
      const [leads, clients, docs] = await Promise.all([
        supabase.from('leads').select('id, name, company').or(`name.ilike.${like},company.ilike.${like}`).limit(5),
        supabase.from('clients').select('id, company').ilike('company', like).limit(5),
        supabase.from('documents').select('id, number, type').ilike('number', like).limit(5),
      ]);
      setHits([
        ...(clients.data ?? []).map((c): SearchHit => ({
          kind: 'client', id: c.id, label: c.company, href: `/clients/?id=${c.id}`,
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
    return () => clearTimeout(t);
  }, [q, open]);

  const KIND_AR = { lead: 'محتمل', client: 'عميل', document: 'مستند' } as const;

  return (
    <Modal open={open} onClose={onClose} title="بحث سريع">
      <Input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث في العملاء والمحتملين والمستندات…"
      />
      <div className="mt-3 space-y-1">
        {busy && <Spinner />}
        {!busy && q.length >= 2 && hits.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-medium">لا نتائج</p>
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
        <h1 className="text-2xl font-black">
          <span className="text-pulse-orange">AGMA</span> OS
        </h1>
        <Input
          type="email"
          required
          dir="ltr"
          label="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          dir="ltr"
          label="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" loading={busy} className="w-full">
          دخول
        </Button>
      </form>
    </div>
  );
}

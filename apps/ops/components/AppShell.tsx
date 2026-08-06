'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { Button } from '@agma/ui';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

const NAV = [
  { href: '/', label: 'المسار' },
  { href: '/clients/', label: 'العملاء' },
  { href: '/website/', label: 'الموقع' },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const pathname = usePathname();

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
    return <div className="grid min-h-screen place-items-center text-gray-medium">…جاري التحميل</div>;
  }
  if (!session) return <LoginForm />;
  if (!profile) {
    return <div className="grid min-h-screen place-items-center text-gray-medium">…التحقق من الصلاحيات</div>;
  }
  if (profile.role === 'client') {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <p className="mb-4">هذا النظام مخصص لفريق AGMA. حسابك حساب عميل.</p>
          <Button variant="outline" onClick={() => getSupabase().auth.signOut()}>
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-6 border-b border-gray-dark px-6 py-3">
        <span className="font-black text-pulse-orange text-lg">AGMA OS</span>
        <nav className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-pulse-orange/15 text-pulse-orange'
                  : 'text-gray-light hover:text-snow'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-3 text-sm text-gray-medium">
          <span>{profile.full_name || profile.email}</span>
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="text-gray-medium hover:text-snow"
          >
            خروج
          </button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
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
        <input
          type="email"
          required
          dir="ltr"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-end placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none"
        />
        <input
          type="password"
          required
          dir="ltr"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-gray-dark bg-transparent px-3 py-2 text-end placeholder:text-gray-medium focus:border-pulse-orange focus:outline-none"
        />
        {error && <p className="text-sm text-pulse-orange">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? '…' : 'دخول'}
        </Button>
      </form>
    </div>
  );
}

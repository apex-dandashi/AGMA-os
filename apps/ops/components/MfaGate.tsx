'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Input, Spinner } from '@agma/ui';
import { getSupabase } from '../lib/supabase';

/**
 * TOTP 2FA (docs/05 §B11.4 — mandatory for team). Three states:
 *  - aal2 reached → render app
 *  - factor exists but session is aal1 → challenge (code prompt)
 *  - no factor → forced enrollment (QR + verify)
 */
export default function MfaGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'checking' | 'ok' | 'challenge' | 'enroll'>('checking');

  async function evaluate() {
    const supabase = getSupabase();
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === 'aal2') {
      setState('ok');
      return;
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((f) => f.status === 'verified');
    setState(verified ? 'challenge' : 'enroll');
  }

  useEffect(() => {
    evaluate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  if (state === 'ok') return <>{children}</>;
  if (state === 'challenge') return <Challenge onDone={evaluate} />;
  return <Enroll onDone={evaluate} />;
}

function Challenge({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function verify() {
    setBusy(true);
    setErr(undefined);
    const supabase = getSupabase();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.find((f) => f.status === 'verified');
    if (!factor) {
      setErr('لا يوجد عامل تحقق');
      setBusy(false);
      return;
    }
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });
    if (chErr || !challenge) {
      setErr('تعذر بدء التحقق');
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code,
    });
    if (error) setErr('رمز غير صحيح');
    else onDone();
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-black">التحقق بخطوتين</h1>
        <p className="text-sm text-gray-light">أدخل الرمز من تطبيق المصادقة</p>
        <Input
          dir="ltr"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={err}
          className="text-center text-xl tracking-[0.5em]"
        />
        <Button className="w-full" size="sm" loading={busy} disabled={code.length !== 6} onClick={verify}>
          تحقق
        </Button>
        <button
          onClick={() => getSupabase().auth.signOut()}
          className="text-xs text-gray-medium hover:text-snow"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

function Enroll({ onDone }: { onDone: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const enrollStarted = React.useRef(false);
  useEffect(() => {
    // Guard against React StrictMode double-invocation creating two factors.
    if (enrollStarted.current) return;
    enrollStarted.current = true;
    (async () => {
      const supabase = getSupabase();
      // Self-heal: drop unverified leftovers from interrupted enrollments —
      // they block re-enrollment with a duplicate-name error.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.all ?? []) {
        if (f.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'AGMA OS',
      });
      if (error || !data) {
        setErr('تعذر بدء التفعيل');
        return;
      }
      setErr(undefined);
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify() {
    if (!factorId) return;
    setBusy(true);
    setErr(undefined);
    const supabase = getSupabase();
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !challenge) {
      setErr('تعذر التحقق');
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (error) setErr('رمز غير صحيح — حاول مجدداً');
    else onDone();
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-xl font-black">تفعيل التحقق بخطوتين</h1>
        <p className="text-sm text-gray-light">
          إلزامي لأعضاء الفريق. امسح الرمز بتطبيق مصادقة (Google Authenticator،
          1Password، Authy…) ثم أدخل الرمز المكوّن من ٦ أرقام.
        </p>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="رمز QR للمصادقة" className="mx-auto h-44 w-44 rounded-sm bg-white p-2" />
        ) : (
          <Spinner className="mx-auto h-6 w-6" />
        )}
        {secret && (
          <p dir="ltr" className="break-all text-xs text-gray-medium">{secret}</p>
        )}
        <Input
          dir="ltr"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={err}
          placeholder="000000"
          className="text-center text-xl tracking-[0.5em]"
        />
        <Button className="w-full" size="sm" loading={busy} disabled={code.length !== 6} onClick={verify}>
          تفعيل
        </Button>
        <button
          onClick={() => getSupabase().auth.signOut()}
          className="text-xs text-gray-medium hover:text-snow"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

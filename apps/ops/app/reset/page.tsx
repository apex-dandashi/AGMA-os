'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@agma/ui';
import { getSupabase } from '../../lib/supabase';

/**
 * Password set/reset. Two modes:
 *  - arriving via recovery/invite link (session present) → set new password
 *  - no session → request a reset email
 */
export default function ResetPage() {
  const [mode, setMode] = useState<'checking' | 'request' | 'set'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    async function evaluate() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setMode('request'); return; }
      // حساب عليه توثيق ثنائي وجلسة الرابط مستوى أول؟ نطلب الرمز قبل التغيير
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setNeedsMfa(aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2');
      setMode('set');
    }
    evaluate();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') evaluate();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function request(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(undefined);
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset/`,
    });
    if (error) setErr('تعذر الإرسال — تحقق من البريد');
    else setMsg('أُرسل رابط إعادة التعيين إلى بريدك (تحقق من الوارد وغير المرغوب).');
    setBusy(false);
  }

  async function setNew(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10) {
      setErr('كلمة المرور ١٠ أحرف على الأقل');
      return;
    }
    setBusy(true);
    setErr(undefined);
    const supabase = getSupabase();

    // التوثيق الثنائي أولاً إن لزم — بدونه يرفض Supabase تغيير كلمة المرور
    if (needsMfa) {
      if (mfaCode.trim().length < 6) {
        setErr('أدخل رمز التحقق من تطبيق المصادقة');
        setBusy(false);
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.find((f) => f.status === 'verified');
      if (factor) {
        const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: factor.id });
        const { error: vErr } = challenge
          ? await supabase.auth.mfa.verify({
              factorId: factor.id, challengeId: challenge.id, code: mfaCode.trim(),
            })
          : { error: new Error('challenge') };
        if (vErr) {
          setErr('رمز التحقق غير صحيح');
          setBusy(false);
          return;
        }
        setNeedsMfa(false);
      }
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('different')) setErr('الجديدة تطابق القديمة — اختر كلمة مرور مختلفة');
      else if (m.includes('aal2') || m.includes('mfa')) setErr('مطلوب رمز التحقق بخطوتين أولاً');
      else if (m.includes('session')) {
        setErr('انتهت صلاحية الرابط — اطلب رابطاً جديداً');
        setMode('request');
      } else if (m.includes('weak') || m.includes('password')) {
        setErr('كلمة المرور لا تحقق الشروط — أطول وأكثر تنوعاً');
      } else setErr(`تعذر التعيين: ${error.message}`);
    } else router.replace('/');
    setBusy(false);
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="AGMA" className="h-9 w-auto" />
          <span className="text-2xl font-black text-snow">OS</span>
        </div>
        {mode === 'request' && (
          <form onSubmit={request} className="space-y-4">
            <p className="text-sm text-gray-light">أدخل بريدك لإرسال رابط إعادة تعيين كلمة المرور.</p>
            <Input type="email" required dir="ltr" label="البريد الإلكتروني"
              value={email} onChange={(e) => setEmail(e.target.value)} error={err} />
            {msg && <p className="text-sm text-gray-light">{msg}</p>}
            <Button type="submit" loading={busy} className="w-full" size="sm">
              إرسال الرابط
            </Button>
          </form>
        )}
        {mode === 'set' && (
          <form onSubmit={setNew} className="space-y-4">
            <p className="text-sm text-gray-light">عيّن كلمة مرور جديدة لحسابك.</p>
            <Input type="password" required dir="ltr" label="كلمة المرور الجديدة"
              value={password} onChange={(e) => setPassword(e.target.value)} error={err}
              hint="١٠ أحرف على الأقل" />
            {needsMfa && (
              <Input dir="ltr" inputMode="numeric" maxLength={6}
                label="رمز التحقق بخطوتين"
                hint="حسابك محمي بالتوثيق الثنائي — أدخل الرمز من تطبيق المصادقة"
                value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
            )}
            <Button type="submit" loading={busy} className="w-full" size="sm">
              حفظ والدخول
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

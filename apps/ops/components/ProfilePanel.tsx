'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, Hint, Input, Select, SkeletonList, useToast,
} from '@agma/ui';
import { DIAL_CODES } from '@agma/ui';
import { Camera, KeyRound, PenLine, UserRound } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/**
 * الملف الشخصي: كل عضو يعدل بياناته هو — الاسم، المسمى، الجوال، الصورة،
 * توقيعه الشخصي. الدور والتفعيل يديرهما مدير النظام فقط (محفّز في القاعدة).
 */

const ROLE_AR: Record<string, string> = {
  admin: 'مدير النظام', strategist: 'استراتيجي', executor: 'منفذ', pm: 'مدير مشاريع',
  sales: 'مبيعات', accountant: 'محاسب', cfo: 'مدير مالي', hr: 'موارد بشرية',
  legal: 'قانوني', auditor: 'مدقق', dpo: 'حماية البيانات', collections: 'تحصيل',
  client: 'عميل',
};

export function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  return getSupabase().storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export default function ProfilePanel() {
  const toast = useToast();
  const key = ['my_profile'];
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: me, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const { data: u } = await s.auth.getUser();
      if (!u.user) throw new Error('لا جلسة');
      const { data, error } = await s.from('profiles').select('*').eq('id', u.user.id).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const [dial, setDial] = useState('+966');
  const [phone, setPhone] = useState('');
  useEffect(() => {
    if (!me?.phone) return;
    const hit = DIAL_CODES.find((d) => me.phone!.startsWith(d.code));
    if (hit) { setDial(hit.code); setPhone(me.phone!.slice(hit.code.length)); }
    else setPhone(me.phone!);
  }, [me?.phone]);

  const save = useAppMutation(
    async (values: { full_name?: string; job_title?: string | null; phone?: string | null }) => {
      const { data: u } = await getSupabase().auth.getUser();
      const { error } = await getSupabase().from('profiles')
        .update(values).eq('id', u.user!.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'حُفظ' }
  );

  const uploadAvatar = useAppMutation(
    async (file: File) => {
      const s = getSupabase();
      const { data: u } = await s.auth.getUser();
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${u.user!.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await s.storage.from('avatars')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { error } = await s.from('profiles')
        .update({ avatar_path: path }).eq('id', u.user!.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'حُدثت صورتك' }
  );

  if (isLoading || !me) return <SkeletonList rows={3} />;
  const photo = avatarUrl(me.avatar_path);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="group relative"
            onClick={() => fileRef.current?.click()}
            aria-label="غيّر صورتك">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-full bg-gray-dark">
                <UserRound className="h-8 w-8 text-gray-medium" aria-hidden />
              </span>
            )}
            <span className="absolute -bottom-1 -start-1 grid h-7 w-7 place-items-center rounded-full bg-pulse-orange text-void opacity-90 transition-opacity group-hover:opacity-100">
              <Camera className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 2 * 1024 * 1024) { toast.error('الصورة تتجاوز ٢MB'); return; }
              uploadAvatar.mutate(f);
              e.target.value = '';
            }} />
          <div>
            <p className="text-lg font-black">{me.full_name ?? '—'}</p>
            <p className="flex items-center gap-2 text-sm text-gray-light">
              <Badge variant="outline">{ROLE_AR[me.role] ?? me.role}</Badge>
              <span dir="ltr">{me.email}</span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="flex items-center gap-2 text-sm font-bold">
          بياناتك
          <Hint text="الاسم والمسمى يظهران للفريق في الدردشة والمهام. الدور وحالة التفعيل يديرهما مدير النظام من صفحة الفريق." />
        </p>
        <Input label="الاسم الكامل" defaultValue={me.full_name ?? ''}
          onBlur={(e) => e.target.value.trim() && e.target.value !== me.full_name
            && save.mutate({ full_name: e.target.value.trim() })} />
        <Input label="المسمى الوظيفي" defaultValue={me.job_title ?? ''}
          placeholder="مثال: استراتيجي حملات أول"
          onBlur={(e) => e.target.value !== (me.job_title ?? '')
            && save.mutate({ job_title: e.target.value.trim() || null })} />
        {/* المفتاح يسار والرقم يمين (قانون L2) */}
        <div>
          <span className="mb-1 block text-xs font-medium text-gray-light">رقم الجوال</span>
          <div dir="ltr" className="flex gap-2">
            <Select value={dial} aria-label="مفتاح الدولة" className="w-40 shrink-0"
              onChange={(e) => setDial(e.target.value)}>
              {DIAL_CODES.map((d) => (
                <option key={d.code} value={d.code}>{d.flag} {d.code} {d.country}</option>
              ))}
            </Select>
            <Input value={phone} inputMode="tel" className="min-w-0 flex-1"
              placeholder="5XXXXXXXX"
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => {
                const full = phone.trim() ? dial + phone.trim().replace(/^0+/, '') : null;
                if (full !== me.phone) save.mutate({ phone: full });
              }} />
          </div>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-3 p-5 text-sm">
        <PenLine className="h-4 w-4 text-pulse-orange" aria-hidden />
        <span className="font-bold">توقيعك الشخصي</span>
        <span className="text-xs text-gray-light">
          {me.signature_data ? 'مسجل ✓' : 'غير مسجل بعد'}
        </span>
        <Link href="/team/" className="ms-auto text-xs text-pulse-orange hover:underline">
          {me.signature_data ? 'حدّثه من صفحة الفريق' : 'سجّله من صفحة الفريق'}
        </Link>
      </Card>

      <Card className="flex flex-wrap items-center gap-3 p-5 text-sm">
        <KeyRound className="h-4 w-4 text-pulse-orange" aria-hidden />
        <span className="font-bold">كلمة المرور</span>
        <Link href="/reset/" className="ms-auto text-xs text-pulse-orange hover:underline">
          غيّرها من هنا
        </Link>
      </Card>
    </div>
  );
}

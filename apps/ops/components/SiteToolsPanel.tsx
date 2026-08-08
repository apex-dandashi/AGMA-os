'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, Hint, Input, Select, SkeletonList, useToast,
} from '@agma/ui';
import { Activity, Link2, QrCode } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { getSupabase } from '../lib/supabase';
import { useAppMutation, useClients } from '../lib/queries';

/** جولة التكاملات: مراقبة مواقع العملاء + أدوات الحملات (UTM وQR) — بلا خوادم. */

export function SiteMonitoringBlock() {
  const key = ['client-sites'];
  const { data: sites, isLoading } = useQuery({
    queryKey: key,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('client_sites').select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const { data: clients } = useClients();
  const [form, setForm] = useState({ url: '', client_id: '', label: '' });
  const toast = useToast();

  const add = useAppMutation(
    async () => {
      const url = form.url.trim().startsWith('http')
        ? form.url.trim() : `https://${form.url.trim()}`;
      const { error } = await getSupabase().from('client_sites').insert({
        url, client_id: form.client_id || null, label: form.label.trim() || null,
      });
      if (error) throw new Error(error.message);
      setForm({ url: '', client_id: '', label: '' });
    },
    { invalidate: [key], successMessage: 'أُضيف الموقع — الفحص كل ٦ ساعات آلياً' }
  );
  const remove = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('client_sites').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const checkNow = async () => {
    toast.success('بدأ الفحص — النتائج خلال لحظات');
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gjaheqlgheizvebvakfd.supabase.co'}/functions/v1/site-monitor`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  };

  if (isLoading || !sites) return <SkeletonList rows={3} />;

  return (
    <Card className="mb-4 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold">
        <Activity className="h-4 w-4 text-pulse-orange" aria-hidden />
        مراقبة المواقع
        <Hint text="فحص آلي كل ٦ ساعات: حالة الموقع وزمن الاستجابة وانتهاء شهادة SSL. السقوط أو اقتراب انتهاء الشهادة (٣٠/١٤/٧/٣/١ يوماً) يصلك إشعاراً فورياً. أضف مواقع عملائك لتصبح أجما مشغّلهم الرقمي لا منفذ مشاريعهم فقط." />
        <Button variant="ghost" size="xs" className="ms-auto" onClick={checkNow}>
          فحص الآن
        </Button>
      </p>
      <div className="mb-3 space-y-1.5">
        {sites.map((s) => {
          const ok = s.last_status != null && s.last_status < 400;
          const sslDays = s.ssl_expires_on
            ? Math.ceil((new Date(s.ssl_expires_on).getTime() - Date.now()) / 864e5)
            : null;
          return (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark/60 p-2.5 text-sm">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                s.last_checked_at == null ? 'bg-gray-medium'
                  : ok ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden />
              <span className="font-bold">{s.label ?? new URL(s.url).hostname}</span>
              <a href={s.url} target="_blank" rel="noreferrer" dir="ltr"
                className="text-xs text-gray-medium hover:text-pulse-orange">{s.url}</a>
              {s.last_checked_at == null ? (
                <Badge variant="neutral">بانتظار أول فحص</Badge>
              ) : ok ? (
                <>
                  <Badge variant="accent">يعمل</Badge>
                  <span dir="ltr" className="text-xs text-gray-medium">{s.last_response_ms} ms</span>
                </>
              ) : (
                <Badge variant="outline">لا يستجيب — {s.last_error ?? s.last_status}</Badge>
              )}
              {sslDays != null && (
                <span className={`text-xs ${sslDays <= 14 ? 'font-bold text-pulse-orange' : 'text-gray-medium'}`}>
                  SSL: {sslDays} يوماً
                </span>
              )}
              {s.client_id && (
                <Badge variant="outline">
                  {(clients ?? []).find((c) => c.id === s.client_id)?.company}
                </Badge>
              )}
              <Button variant="ghost" size="xs" className="ms-auto"
                onClick={() => remove.mutate(s.id)}>حذف</Button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Input label="رابط الموقع" dir="ltr" placeholder="client.com" className="w-52"
          value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
        <Input label="وسم (اختياري)" className="w-40" value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
        <Select label="العميل (اختياري)" value={form.client_id}
          onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}>
          <option value="">— موقع داخلي —</option>
          {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </Select>
        <Button size="sm" loading={add.isPending} disabled={form.url.trim().length < 4}
          onClick={() => add.mutate(undefined as never)}>
          + راقب موقعاً
        </Button>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------- campaign tools */

export function CampaignToolsBlock() {
  const toast = useToast();
  const [utm, setUtm] = useState({
    url: '', source: 'instagram', medium: 'paid_social', campaign: '', content: '',
  });
  const utmUrl = useMemo(() => {
    if (!utm.url.trim() || !utm.campaign.trim()) return '';
    try {
      const u = new URL(utm.url.trim().startsWith('http') ? utm.url.trim() : `https://${utm.url.trim()}`);
      u.searchParams.set('utm_source', utm.source);
      u.searchParams.set('utm_medium', utm.medium);
      u.searchParams.set('utm_campaign', utm.campaign.trim());
      if (utm.content.trim()) u.searchParams.set('utm_content', utm.content.trim());
      return u.toString();
    } catch { return ''; }
  }, [utm]);

  const [qrText, setQrText] = useState('');
  const qrSvg = useMemo(() => {
    const value = qrText.trim() || utmUrl;
    if (!value) return null;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(value);
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 2 });
    } catch { return null; }
  }, [qrText, utmUrl]);

  return (
    <Card className="mb-4 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Link2 className="h-4 w-4 text-pulse-orange" aria-hidden />
        أدوات الحملات — روابط UTM ورمز QR
        <Hint text="ابنِ رابط الحملة الموسوم فيُنسب كل زائر لمصدره في التحليلات، وولّد QR له مباشرة (يصلح أيضاً لأي نص/رقم واتساب). كل شيء داخل المنصة — لا خدمات خارجية." />
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Input label="الرابط الوجهة" dir="ltr" placeholder="agma.com.sa/offer" value={utm.url}
          onChange={(e) => setUtm((f) => ({ ...f, url: e.target.value }))} />
        <Select label="المصدر" value={utm.source}
          onChange={(e) => setUtm((f) => ({ ...f, source: e.target.value }))}>
          {['instagram', 'tiktok', 'snapchat', 'x', 'linkedin', 'google', 'whatsapp', 'email', 'qr']
            .map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="الوسيلة" value={utm.medium}
          onChange={(e) => setUtm((f) => ({ ...f, medium: e.target.value }))}>
          {['paid_social', 'organic_social', 'cpc', 'email', 'referral', 'offline']
            .map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="اسم الحملة" dir="ltr" placeholder="summer_offer" value={utm.campaign}
          onChange={(e) => setUtm((f) => ({ ...f, campaign: e.target.value }))} />
        <Input label="المحتوى (اختياري)" dir="ltr" value={utm.content}
          onChange={(e) => setUtm((f) => ({ ...f, content: e.target.value }))} />
      </div>
      {utmUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-sm bg-gray-dark/30 p-2.5">
          <code dir="ltr" className="break-all text-xs text-gray-light">{utmUrl}</code>
          <Button variant="outline" size="xs" className="ms-auto"
            onClick={() => { navigator.clipboard.writeText(utmUrl); toast.success('نُسخ الرابط'); }}>
            نسخ
          </Button>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <div className="min-w-64 flex-1">
          <Input label="نص/رابط لرمز QR (يستخدم رابط الحملة أعلاه إن تُرك فارغاً)"
            dir="ltr" value={qrText} onChange={(e) => setQrText(e.target.value)} />
        </div>
        {qrSvg && (
          <div className="rounded-sm bg-white p-2"
            role="img" aria-label="رمز QR"
            dangerouslySetInnerHTML={{ __html: qrSvg }} />
        )}
        {qrSvg && (
          <Button variant="outline" size="xs"
            onClick={() => {
              const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'agma-qr.svg';
              a.click();
              URL.revokeObjectURL(a.href);
            }}>
            <QrCode className="h-3.5 w-3.5" aria-hidden /> تنزيل SVG
          </Button>
        )}
      </div>
    </Card>
  );
}

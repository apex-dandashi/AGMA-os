'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Hint, Input, Select,
  SkeletonList, Tabs, Textarea, useToast,
} from '@agma/ui';
import {
  CalendarClock, CheckCheck, Eye, Link2, PenLine, Send, Sparkles, Trash2,
} from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/**
 * محرك المحتوى (المرحلة ٨): فكرة ← مسودة (يدوية أو AI) ← «راجعتُه» ← اعتماد
 * العميل من بوابته ← جدولة ← نشر. البوابتان مفروضتان في القاعدة نفسها:
 * لا AI يصل العميل بلا مراجعة موثقة، ولا نشر لغير المعتمد.
 */

const CHANNEL_AR: Record<Enums<'content_channel'>, string> = {
  article: 'مقال', social_post: 'منشور سوشيال', reel_script: 'سكربت ريل',
  email: 'إيميل', ad_copy: 'نص إعلان',
};

const STATUS_AR: Record<Enums<'content_status'>, { label: string; variant: 'accent' | 'neutral' | 'outline' }> = {
  idea: { label: 'فكرة', variant: 'neutral' },
  draft: { label: 'مسودة', variant: 'neutral' },
  internal_review: { label: 'مراجعة داخلية', variant: 'outline' },
  client_review: { label: 'عند العميل', variant: 'outline' },
  approved: { label: 'معتمد ✓', variant: 'accent' },
  scheduled: { label: 'مجدول', variant: 'outline' },
  published: { label: 'منشور', variant: 'accent' },
  archived: { label: 'مؤرشف', variant: 'neutral' },
};

const TABS = [
  { key: 'active', label: 'قيد العمل' },
  { key: 'client', label: 'عند العميل' },
  { key: 'ready', label: 'معتمد ومجدول' },
  { key: 'published', label: 'المنشور' },
  { key: 'all', label: 'الكل' },
];

export default function ContentPanel() {
  const toast = useToast();
  const key = ['content_items'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [items, clients, approvals] = await Promise.all([
        s.from('content_items').select('*').order('created_at', { ascending: false }),
        s.from('clients').select('id, company').eq('status', 'active').order('company'),
        // ملاحظات قرارات العملاء (قراءة استراتيجي فأعلى — قد تعود فارغة لغيرهم)
        s.from('approvals').select('item_id, status, note, decided_at')
          .eq('item_type', 'content').order('created_at', { ascending: false }),
      ]);
      return {
        items: items.data ?? [],
        clients: clients.data ?? [],
        approvals: approvals.data ?? [],
      };
    },
  });

  const [tab, setTab] = useState('active');
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Tables<'content_items'> | null>(null);

  // نموذج الإنشاء — دروب مينيو في كل حقل قابل (قانون L1)
  const [nTitle, setNTitle] = useState('');
  const [nClient, setNClient] = useState('');
  const [nChannel, setNChannel] = useState<Enums<'content_channel'>>('social_post');
  const [nBrief, setNBrief] = useState('');

  const create = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('content_items').insert({
        client_id: nClient, channel: nChannel, title: nTitle.trim(),
        brief: nBrief.trim() || null,
      });
      if (error) throw new Error(error.message);
      setNTitle(''); setNBrief('');
    },
    { invalidate: [key], successMessage: 'أُضيفت الفكرة — ولّد نصها أو اكتبه يدوياً' }
  );

  const patch = useAppMutation(
    async ({ id, values, msg }: {
      id: string; values: Partial<Tables<'content_items'>>; msg?: string;
    }) => {
      const { error } = await getSupabase().from('content_items')
        .update(values).eq('id', id);
      if (error) throw new Error(error.message);
      if (msg) toast.success(msg);
    },
    { invalidate: [key] }
  );

  const remove = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('content_items').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setConfirmDel(null);
    },
    { invalidate: [key], successMessage: 'حُذف — كأن شيئاً لم يكن' }
  );

  const [genFor, setGenFor] = useState<string | null>(null);
  const [genDirections, setGenDirections] = useState('');
  const generate = useAppMutation(
    async (id: string) => {
      const { data: res, error } = await getSupabase().functions.invoke('generate-copy', {
        body: { content_item_id: id, directions: genDirections.trim() || undefined },
      });
      if (error) {
        const ctx = (error as { context?: unknown }).context;
        if (ctx instanceof Response) {
          const body = await ctx.json().catch(() => null);
          if (body?.message) throw new Error(body.message);
        }
        throw new Error('تعذر التوليد — حاول مجدداً');
      }
      if (!res?.ok) throw new Error(res?.message ?? 'تعذر التوليد');
      setGenFor(null); setGenDirections('');
    },
    { invalidate: [key],
      successMessage: 'وُلد النص مسودةً — راجعه واضغط «راجعتُه» قبل عرضه على العميل' }
  );

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    switch (tab) {
      case 'active': return items.filter((i) => ['idea', 'draft', 'internal_review'].includes(i.status));
      case 'client': return items.filter((i) => i.status === 'client_review');
      case 'ready': return items.filter((i) => ['approved', 'scheduled'].includes(i.status));
      case 'published': return items.filter((i) => i.status === 'published');
      default: return items.filter((i) => i.status !== 'archived');
    }
  }, [data, tab]);

  if (isLoading || !data) return <SkeletonList rows={4} />;

  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.company ?? '—';

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-pulse-orange" aria-hidden />
          محتوى جديد
          <Hint text="المسار: فكرة ← مسودة (اكتبها أو ولّدها بالذكاء الاصطناعي) ← «راجعتُه» توثيق المراجعة البشرية ← اعرضه على العميل ليعتمده من بوابته ← جدوِل ← انشر. النظام يمنع تخطي أي بوابة." />
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Select label="العميل" className="w-44" value={nClient}
            onChange={(e) => setNClient(e.target.value)}>
            <option value="">— اختر —</option>
            {data.clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
          </Select>
          <Select label="القناة" className="w-36" value={nChannel}
            onChange={(e) => setNChannel(e.target.value as Enums<'content_channel'>)}>
            {Object.entries(CHANNEL_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="العنوان / الفكرة" className="w-64" value={nTitle}
            onChange={(e) => setNTitle(e.target.value)} />
          <Input label="موجز (اختياري)" className="w-64" value={nBrief}
            onChange={(e) => setNBrief(e.target.value)} />
          <Button size="sm" loading={create.isPending}
            disabled={!nClient || nTitle.trim().length < 3}
            onClick={() => create.mutate(undefined as never)}>
            + أضف
          </Button>
        </div>
      </Card>

      <Tabs active={tab} onChange={setTab} tabs={TABS} />

      {filtered.length === 0 ? (
        <EmptyState icon={<PenLine className="h-8 w-8" aria-hidden />}
          title="لا محتوى هنا بعد"
          hint="أضف فكرة من الأعلى — اختر العميل والقناة واكتب العنوان، والباقي يمشي خطوة خطوة." />
      ) : filtered.map((item) => {
        const st = STATUS_AR[item.status];
        const decision = data.approvals.find((a) => a.item_id === item.id && a.note);
        const needsReview = item.ai_generated && !item.human_reviewed_by;
        const open = openId === item.id;
        return (
          <Card key={item.id} className="p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{CHANNEL_AR[item.channel]}</Badge>
              <span className="font-bold">{item.title}</span>
              <span className="text-xs text-gray-medium">{clientName(item.client_id)}</span>
              <Badge variant={st.variant}>{st.label}</Badge>
              {item.ai_generated && (
                <Badge variant={needsReview ? 'outline' : 'neutral'}>
                  {needsReview ? 'AI — بانتظار مراجعة بشرية' : 'AI ✓ روجع'}
                </Badge>
              )}
              {item.scheduled_for && item.status === 'scheduled' && (
                <span className="flex items-center gap-1 text-xs text-gray-light">
                  <CalendarClock className="h-3 w-3" aria-hidden />
                  {new Date(item.scheduled_for).toLocaleDateString('ar-SA')}
                </span>
              )}
              <span className="ms-auto flex items-center gap-1.5">
                <Button variant="ghost" size="xs" onClick={() => setOpenId(open ? null : item.id)}>
                  <Eye className="h-3 w-3" aria-hidden /> {open ? 'إغلاق' : 'افتح'}
                </Button>
                {['idea', 'draft'].includes(item.status) && (
                  <Button variant="ghost" size="xs" onClick={() => setConfirmDel(item)}>
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </Button>
                )}
              </span>
            </div>

            {decision?.note && item.status === 'internal_review' && (
              <p className="mt-2 rounded-sm border border-pulse-orange/40 p-2 text-xs text-pulse-orange">
                ملاحظة العميل: «{decision.note}»
              </p>
            )}

            {open && (
              <div className="mt-3 space-y-3 border-t border-gray-dark pt-3">
                {item.brief && <p className="text-xs text-gray-light">الموجز: {item.brief}</p>}

                <Textarea key={`${item.id}-${item.updated_at}`} label="نص المحتوى (يُحفظ عند مغادرة الحقل)"
                  rows={8} defaultValue={item.body ?? ''}
                  onBlur={(e) => e.target.value !== (item.body ?? '')
                    && patch.mutate({ id: item.id, values: { body: e.target.value || null }, msg: 'حُفظ النص' })}
                  placeholder="اكتب النص هنا، أو ولّده بالذكاء الاصطناعي…" />

                <div className="flex flex-wrap items-center gap-2">
                  {['idea', 'draft', 'internal_review'].includes(item.status) && (
                    <Button variant="ghost" size="xs"
                      onClick={() => { setGenFor(genFor === item.id ? null : item.id); setGenDirections(''); }}>
                      <Sparkles className="h-3 w-3" aria-hidden /> ولّد النص بالذكاء الاصطناعي
                    </Button>
                  )}

                  {needsReview && item.body && (
                    <Button size="xs" loading={patch.isPending}
                      onClick={async () => {
                        const { data: u } = await getSupabase().auth.getUser();
                        patch.mutate({ id: item.id,
                          values: { human_reviewed_by: u.user?.id ?? null },
                          msg: 'وُثقت مراجعتك البشرية ✓' });
                      }}>
                      <CheckCheck className="h-3 w-3" aria-hidden /> راجعتُه — النص سليم
                    </Button>
                  )}

                  {item.status === 'idea' && item.body && (
                    <Button variant="outline" size="xs"
                      onClick={() => patch.mutate({ id: item.id, values: { status: 'draft' }, msg: 'صارت مسودة' })}>
                      اجعلها مسودة
                    </Button>
                  )}
                  {['draft', 'idea'].includes(item.status) && item.body && (
                    <Button variant="outline" size="xs"
                      onClick={() => patch.mutate({ id: item.id, values: { status: 'internal_review' }, msg: 'دخل المراجعة الداخلية' })}>
                      للمراجعة الداخلية
                    </Button>
                  )}
                  {item.status === 'internal_review' && (
                    <Button size="xs"
                      onClick={() => patch.mutate({ id: item.id, values: { status: 'client_review' },
                        msg: 'عُرض على العميل في بوابته — سيُشعر فوراً' })}>
                      <Send className="h-3 w-3" aria-hidden /> اعرضه على العميل
                    </Button>
                  )}
                  {item.status === 'approved' && (
                    <span className="flex items-end gap-2">
                      <Input label="تاريخ النشر" type="date" className="w-36"
                        onChange={(e) => e.target.value && patch.mutate({ id: item.id,
                          values: { status: 'scheduled', scheduled_for: e.target.value },
                          msg: 'جُدول للنشر' })} />
                    </span>
                  )}
                  {['approved', 'scheduled'].includes(item.status) && (
                    <Button size="xs"
                      onClick={() => patch.mutate({ id: item.id, values: { status: 'published' },
                        msg: 'نُشر — ثبّت رابط النشر أدناه' })}>
                      نُشر الآن
                    </Button>
                  )}
                  {item.status === 'published' && (
                    <span className="flex items-end gap-1">
                      <Link2 className="mb-2 h-3 w-3 text-gray-medium" aria-hidden />
                      <Input label="رابط المنشور" dir="ltr" className="w-64"
                        defaultValue={item.publish_url ?? ''}
                        onBlur={(e) => e.target.value !== (item.publish_url ?? '')
                          && patch.mutate({ id: item.id, values: { publish_url: e.target.value || null } })} />
                    </span>
                  )}
                </div>

                {genFor === item.id && (
                  <div className="flex flex-wrap items-end gap-2 rounded-sm border border-pulse-orange/50 p-2">
                    <Textarea label="توجيهات إضافية للذكاء الاصطناعي (اختياري — النبرة، نقاط لازم تنذكر…)"
                      rows={2} className="min-w-80" value={genDirections}
                      onChange={(e) => setGenDirections(e.target.value)} />
                    <Button size="xs" loading={generate.isPending}
                      onClick={() => generate.mutate(item.id)}>
                      ولّد (١٠–٣٠ ثانية)
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => setGenFor(null)}>إلغاء</Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <ConfirmDialog
        open={confirmDel != null}
        title="حذف المحتوى؟"
        message={`«${confirmDel?.title ?? ''}» سيُحذف نهائياً — هذا للأفكار والمسودات المدخلة بالخطأ فقط.`}
        confirmLabel="احذف"
        danger
        onConfirm={() => { if (confirmDel) remove.mutate(confirmDel.id); }}
        onClose={() => setConfirmDel(null)}
      />
    </div>
  );
}

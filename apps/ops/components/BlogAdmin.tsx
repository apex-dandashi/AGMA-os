'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Hint, Input,
  SkeletonList, Textarea, useToast,
} from '@agma/ui';
import {
  CheckCheck, ExternalLink, Globe, Newspaper, Rss, Sparkles, Trash2,
} from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/**
 * مدونة الموقع (محرك المقالات اليومية): cron يجمع إشارات المجال كل صباح
 * ويولّد مسودة اليوم آلياً — تهبط هنا «للمراجعة»، تحررها وتضغط «راجعتُه»
 * ثم «انشر». الموقع يخبز المنشور صفحات ثابتة (SEO/GEO) في البناء اليومي.
 */

const ART_STATUS: Record<string, { label: string; variant: 'accent' | 'neutral' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'neutral' },
  review: { label: 'للمراجعة', variant: 'outline' },
  published: { label: 'منشور ✓', variant: 'accent' },
  archived: { label: 'مؤرشف', variant: 'neutral' },
};

export default function BlogAdmin() {
  const toast = useToast();
  const key = ['blog_admin'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [articles, sources, signals] = await Promise.all([
        s.from('articles').select('*').order('created_at', { ascending: false }).limit(50),
        s.from('content_sources').select('*').order('name'),
        s.from('content_signals').select('*').is('used_in_article', null)
          .order('collected_at', { ascending: false }).limit(40),
      ]);
      return {
        articles: articles.data ?? [],
        sources: sources.data ?? [],
        signals: signals.data ?? [],
      };
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Tables<'articles'> | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [topic, setTopic] = useState('');
  const [srcName, setSrcName] = useState('');
  const [srcUrl, setSrcUrl] = useState('');
  const [showSources, setShowSources] = useState(false);

  const patch = useAppMutation(
    async ({ id, values, msg }: {
      id: string; values: Partial<Tables<'articles'>>; msg?: string;
    }) => {
      const { error } = await getSupabase().from('articles').update(values).eq('id', id);
      if (error) throw new Error(error.message);
      if (msg) toast.success(msg);
    },
    { invalidate: [key] }
  );

  const removeArt = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('articles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setConfirmDel(null);
    },
    { invalidate: [key], successMessage: 'حُذفت المسودة' }
  );

  const generate = useAppMutation(
    async () => {
      const body: Record<string, unknown> = {};
      if (picked.size) body.signal_ids = [...picked];
      if (topic.trim()) body.topic = topic.trim();
      const { data: res, error } = await getSupabase().functions
        .invoke('generate-article', { body });
      if (error) {
        const ctx = (error as { context?: unknown }).context;
        if (ctx instanceof Response) {
          const b = await ctx.json().catch(() => null);
          if (b?.message) throw new Error(b.message);
        }
        throw new Error('تعذر التوليد — حاول مجدداً');
      }
      if (!res?.ok) throw new Error(res?.message ?? 'تعذر التوليد');
      setPicked(new Set()); setTopic('');
    },
    { invalidate: [key],
      successMessage: 'وُلد المقال ودخل «للمراجعة» — حرره واضغط «راجعتُه» ثم انشر' }
  );

  const addSource = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('content_sources').insert({
        name: srcName.trim(), feed_url: srcUrl.trim(),
      });
      if (error) throw new Error(error.message);
      setSrcName(''); setSrcUrl('');
    },
    { invalidate: [key], successMessage: 'أُضيف المصدر — سيُجمع منه صباح الغد' }
  );

  const toggleSource = useAppMutation(
    async (s: Tables<'content_sources'>) => {
      const { error } = await getSupabase().from('content_sources')
        .update({ active: !s.active }).eq('id', s.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  const reviewQueue = useMemo(
    () => (data?.articles ?? []).filter((a) => a.status === 'review' || a.status === 'draft'),
    [data]
  );
  const publishedList = useMemo(
    () => (data?.articles ?? []).filter((a) => a.status === 'published'),
    [data]
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;

  return (
    <div className="space-y-4">
      {/* توليد مقال: إشارات مختارة أو موضوع حر */}
      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Newspaper className="h-4 w-4 text-pulse-orange" aria-hidden />
          إشارات المجال ({data.signals.length})
          <Hint text="يجمعها النظام كل صباح (٧:٣٠) من مصادر RSS المسجلة، ويولّد مسودة اليوم آلياً إن كان مفتاح التوليد مهيأً. اختر إشارات وولّد مقالاً إضافياً متى شئت، أو اكتب موضوعاً حراً." />
          <Button variant="ghost" size="xs" className="ms-auto"
            onClick={() => setShowSources(!showSources)}>
            <Rss className="h-3 w-3" aria-hidden /> المصادر ({data.sources.filter((s) => s.active).length})
          </Button>
        </p>

        {showSources && (
          <div className="mb-3 rounded-sm border border-gray-dark p-3">
            <div className="mb-2 flex flex-wrap items-end gap-2">
              <Input label="اسم المصدر" className="w-44" value={srcName}
                onChange={(e) => setSrcName(e.target.value)} />
              <Input label="رابط RSS" dir="ltr" className="w-72" value={srcUrl}
                onChange={(e) => setSrcUrl(e.target.value)} placeholder="https://example.com/feed" />
              <Button size="sm" loading={addSource.isPending}
                disabled={srcName.trim().length < 2 || !/^https?:\/\/.+/.test(srcUrl.trim())}
                onClick={() => addSource.mutate(undefined as never)}>
                + أضف
              </Button>
            </div>
            {data.sources.map((s) => (
              <div key={s.id} className="flex items-center gap-2 py-1 text-xs">
                <Badge variant={s.active ? 'accent' : 'neutral'}>{s.active ? 'فعال' : 'موقوف'}</Badge>
                <span className="font-bold">{s.name}</span>
                <span dir="ltr" className="truncate text-gray-medium">{s.feed_url}</span>
                {s.last_collected_at && (
                  <span className="text-gray-medium">
                    آخر جمع {new Date(s.last_collected_at).toLocaleDateString('ar-SA')}
                  </span>
                )}
                <Button variant="ghost" size="xs" className="ms-auto"
                  onClick={() => toggleSource.mutate(s)}>
                  {s.active ? 'أوقف' : 'فعّل'}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3 max-h-56 space-y-1 overflow-y-auto">
          {data.signals.length === 0 && (
            <p className="text-xs text-gray-medium">
              لا إشارات بعد — الجمع الأول يعمل تلقائياً صباح الغد، أو اكتب موضوعاً حراً أدناه.
            </p>
          )}
          {data.signals.map((sig) => (
            <label key={sig.id} className="flex cursor-pointer items-start gap-2 rounded-sm p-1 text-xs hover:bg-white/5">
              <input type="checkbox" className="mt-0.5 accent-pulse-orange"
                checked={picked.has(sig.id)}
                onChange={(e) => {
                  const next = new Set(picked);
                  if (e.target.checked) next.add(sig.id); else next.delete(sig.id);
                  setPicked(next);
                }} />
              <span>
                <b>{sig.title}</b>
                <a href={sig.url} target="_blank" rel="noreferrer" dir="ltr"
                  className="ms-2 text-pulse-orange hover:underline">
                  المصدر ↗
                </a>
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Input label="أو موضوع حر (اختياري)" className="w-80" value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="مثال: كيف تستفيد المطاعم السعودية من إعلانات تيك توك" />
          <Button size="sm" loading={generate.isPending}
            disabled={picked.size === 0 && topic.trim().length < 5}
            onClick={() => generate.mutate(undefined as never)}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> ولّد مقالاً (٣٠–٦٠ ثانية)
          </Button>
        </div>
      </Card>

      {/* طابور المراجعة */}
      <p className="flex items-center gap-2 text-sm font-bold">
        للمراجعة والنشر ({reviewQueue.length})
        <Hint text="المسودات الآلية واليدوية. حرر النص، اضغط «راجعتُه» لتوثيق المراجعة البشرية (إلزامي لمقالات AI)، ثم «انشر». يظهر المقال فوراً في agma.com.sa/blog ويُخبز صفحة ثابتة في البناء اليومي التالي." />
      </p>
      {reviewQueue.length === 0 && (
        <EmptyState icon={<Newspaper className="h-8 w-8" aria-hidden />}
          title="لا مسودات بانتظارك"
          hint="مسودة اليوم تصل صباحاً تلقائياً، أو ولّد واحدة الآن من الأعلى." />
      )}
      {reviewQueue.map((a) => {
        const open = openId === a.id;
        const needsReview = a.ai_generated && !a.human_reviewed_by;
        return (
          <Card key={a.id} className="p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold">{a.title}</span>
              <Badge variant={ART_STATUS[a.status].variant}>{ART_STATUS[a.status].label}</Badge>
              {a.ai_generated && (
                <Badge variant={needsReview ? 'outline' : 'neutral'}>
                  {needsReview ? 'AI — بانتظار مراجعتك' : 'AI ✓ روجع'}
                </Badge>
              )}
              <span className="ms-auto flex gap-1.5">
                <Button variant="ghost" size="xs" onClick={() => setOpenId(open ? null : a.id)}>
                  {open ? 'إغلاق' : 'افتح وحرر'}
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setConfirmDel(a)}>
                  <Trash2 className="h-3 w-3" aria-hidden />
                </Button>
              </span>
            </div>
            {open && (
              <div className="mt-3 space-y-3 border-t border-gray-dark pt-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input label="العنوان" defaultValue={a.title}
                    onBlur={(e) => e.target.value !== a.title && e.target.value.trim()
                      && patch.mutate({ id: a.id, values: { title: e.target.value } })} />
                  <Input label="الرابط الثابت (لاتيني)" dir="ltr" defaultValue={a.slug}
                    onBlur={(e) => e.target.value !== a.slug && e.target.value.trim()
                      && patch.mutate({ id: a.id, values: { slug: e.target.value.trim() } })} />
                </div>
                <Textarea label="الخلاصة (تظهر في القائمة ونتائج البحث)" rows={2}
                  defaultValue={a.excerpt ?? ''}
                  onBlur={(e) => e.target.value !== (a.excerpt ?? '')
                    && patch.mutate({ id: a.id, values: { excerpt: e.target.value || null } })} />
                <Textarea key={`${a.id}-${a.updated_at}`} label="نص المقال (ماركداون — يُحفظ عند مغادرة الحقل)"
                  rows={14} defaultValue={a.body_md ?? ''}
                  onBlur={(e) => e.target.value !== (a.body_md ?? '')
                    && patch.mutate({ id: a.id, values: { body_md: e.target.value || null }, msg: 'حُفظ' })} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input label="عنوان SEO (≤ ٦٠ حرفاً)" defaultValue={a.seo_title ?? ''}
                    onBlur={(e) => e.target.value !== (a.seo_title ?? '')
                      && patch.mutate({ id: a.id, values: { seo_title: e.target.value || null } })} />
                  <Input label="وصف SEO (≤ ١٥٥ حرفاً)" defaultValue={a.seo_description ?? ''}
                    onBlur={(e) => e.target.value !== (a.seo_description ?? '')
                      && patch.mutate({ id: a.id, values: { seo_description: e.target.value || null } })} />
                </div>
                {(a.sources as { title: string; url: string }[]).length > 0 && (
                  <p className="text-xs text-gray-medium">
                    المصادر: {(a.sources as { title: string; url: string }[]).map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noreferrer"
                        className="me-2 text-pulse-orange hover:underline">
                        {s.title} ↗
                      </a>
                    ))}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {needsReview && (
                    <Button size="xs"
                      onClick={async () => {
                        const { data: u } = await getSupabase().auth.getUser();
                        patch.mutate({ id: a.id,
                          values: { human_reviewed_by: u.user?.id ?? null },
                          msg: 'وُثقت مراجعتك ✓ — يمكنك النشر الآن' });
                      }}>
                      <CheckCheck className="h-3 w-3" aria-hidden /> راجعتُه — المقال سليم
                    </Button>
                  )}
                  <Button size="xs" variant="outline"
                    onClick={() => patch.mutate({ id: a.id, values: { status: 'published' },
                      msg: 'نُشر في agma.com.sa/blog — الصفحة الثابتة تُخبز في البناء اليومي' })}>
                    <Globe className="h-3 w-3" aria-hidden /> انشر
                  </Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* المنشور */}
      {publishedList.length > 0 && (
        <>
          <p className="text-sm font-bold">المنشور ({publishedList.length})</p>
          {publishedList.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <span className="font-bold">{a.title}</span>
              <span className="text-xs text-gray-medium">
                {a.published_at && new Date(a.published_at).toLocaleDateString('ar-SA')}
              </span>
              {/* القارئ الفوري يعمل لحظة النشر؛ الصفحة الثابتة تُخبز في البناء اليومي */}
              <a href={`https://agma.com.sa/blog/read/?slug=${encodeURIComponent(a.slug)}`}
                target="_blank" rel="noreferrer"
                className="ms-auto flex items-center gap-1 text-xs text-pulse-orange hover:underline">
                <ExternalLink className="h-3 w-3" aria-hidden /> افتحه في الموقع
              </a>
              <Button variant="ghost" size="xs"
                onClick={() => patch.mutate({ id: a.id, values: { status: 'archived' },
                  msg: 'أُرشف — اختفى من الموقع' })}>
                أرشف
              </Button>
            </Card>
          ))}
        </>
      )}

      <ConfirmDialog
        open={confirmDel != null}
        title="حذف المسودة؟"
        message={`«${confirmDel?.title ?? ''}» ستُحذف نهائياً.`}
        confirmLabel="احذف"
        danger
        onConfirm={() => { if (confirmDel) removeArt.mutate(confirmDel.id); }}
        onClose={() => setConfirmDel(null)}
      />
    </div>
  );
}

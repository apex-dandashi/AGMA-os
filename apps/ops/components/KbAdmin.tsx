'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, Hint, Input, Select,
  SkeletonList, Textarea, useToast,
} from '@agma/ui';
import { BookOpen, Brain, RefreshCw, Trash2 } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/**
 * قاعدة المعرفة: وقود المساعد الذكي بواجهاته (بوت الموقع، مساعد البوابة،
 * واتساب لاحقاً). المساعد يجيب من المنشور المفهرس فقط ويستشهد به —
 * والأسئلة التي عجز عنها تظهر هنا كفرص مقالات جديدة.
 */

const AUD_AR: Record<Enums<'kb_audience'>, string> = {
  public: 'عام (الموقع والجميع)', client: 'العملاء (بواباتهم)', internal: 'داخلي (الفريق فقط)',
};

export default function KbAdmin() {
  const toast = useToast();
  const key = ['kb_admin'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [arts, gaps] = await Promise.all([
        s.from('kb_articles').select('*').order('category').order('title'),
        s.from('assistant_logs').select('question, surface, created_at')
          .eq('confident', false).order('created_at', { ascending: false }).limit(15),
      ]);
      return { arts: arts.data ?? [], gaps: gaps.data ?? [] };
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Tables<'kb_articles'> | null>(null);

  const patch = useAppMutation(
    async ({ id, values, msg }: {
      id: string; values: Partial<Tables<'kb_articles'>>; msg?: string;
    }) => {
      const { error } = await getSupabase().from('kb_articles').update(values).eq('id', id);
      if (error) throw new Error(error.message);
      if (msg) toast.success(msg);
    },
    { invalidate: [key] }
  );

  const create = useAppMutation(
    async () => {
      const { data: row, error } = await getSupabase().from('kb_articles').insert({
        title: 'مقال معرفة جديد — عدّل العنوان', body_md: '', category: 'عام',
      }).select('id').single();
      if (error) throw new Error(error.message);
      setOpenId(row.id);
    },
    { invalidate: [key], successMessage: 'أُنشئ — اكتب المحتوى وانشره ثم أعد الفهرسة' }
  );

  const remove = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('kb_articles').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setConfirmDel(null);
    },
    { invalidate: [key], successMessage: 'حُذف' }
  );

  const reindex = useAppMutation(
    async () => {
      // الدالة تفهرس دفعة صغيرة كل نداء (حدود حوسبة Edge) — نكرر حتى تفرغ
      let total = 0;
      for (let round = 0; round < 80; round++) {
        const { data: res, error } = await getSupabase().functions.invoke('kb-reindex', { body: {} });
        if (error) {
          const ctx = (error as { context?: unknown }).context;
          if (ctx instanceof Response) {
            const b = await ctx.json().catch(() => null);
            if (b?.message) throw new Error(b.message);
          }
          throw new Error('تعذرت الفهرسة — حاول مجدداً');
        }
        total += res?.indexed ?? 0;
        if (!res?.remaining) break;
      }
      toast.success(`فُهرست ${total} مقالة — المساعد يعرفها الآن`);
    },
    { invalidate: [key] }
  );

  if (isLoading || !data) return <SkeletonList rows={4} />;

  const dirtyCount = data.arts.filter((a) => a.published && !a.indexed_at).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => create.mutate(undefined as never)}
          loading={create.isPending}>
          + مقال معرفة
        </Button>
        <Button size="sm" variant={dirtyCount > 0 ? 'primary' : 'outline'}
          loading={reindex.isPending}
          onClick={() => reindex.mutate(undefined as never)}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          أعد الفهرسة{dirtyCount > 0 ? ` (${dirtyCount} بانتظارها)` : ''}
        </Button>
        <Hint text="المساعد يجيب فقط من المقالات المنشورة والمفهرسة. أي تعديل يلغي فهرسة المقال حتى تضغط «أعد الفهرسة». الجمهور يحدد من يصله المحتوى: عام للموقع، العملاء لبواباتهم، داخلي لا يخرج للمساعدات إطلاقاً." />
      </div>

      {data.gaps.length > 0 && (
        <Card className="border-pulse-orange/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Brain className="h-4 w-4 text-pulse-orange" aria-hidden />
            أسئلة عجز عنها المساعد ({data.gaps.length})
            <Hint text="كل سؤال هنا = مقال معرفة ناقص. اكتب المقال وانشره وأعد الفهرسة — والمساعد يجيب عنه من الآن فصاعداً." />
          </p>
          <ul className="space-y-1 text-xs text-gray-light">
            {data.gaps.map((g, i) => (
              <li key={i} className="flex items-center gap-2">
                <Badge variant="outline">{g.surface === 'site' ? 'الموقع' : 'البوابة'}</Badge>
                <span className="truncate">{g.question}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.arts.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-8 w-8" aria-hidden />}
          title="لا مقالات معرفة" hint="أضف أول مقال — منه يتعلم مساعدك." />
      ) : data.arts.map((a) => {
        const open = openId === a.id;
        return (
          <Card key={a.id} className="p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold">{a.title}</span>
              <Badge variant="outline">{a.category}</Badge>
              <Badge variant="neutral">{AUD_AR[a.audience]}</Badge>
              <Badge variant={a.published ? 'accent' : 'neutral'}>
                {a.published ? (a.indexed_at ? 'منشور ومفهرس ✓' : 'منشور — بانتظار الفهرسة') : 'مسودة'}
              </Badge>
              <span className="ms-auto flex gap-1.5">
                <Button variant="ghost" size="xs" onClick={() => setOpenId(open ? null : a.id)}>
                  {open ? 'إغلاق' : 'حرر'}
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setConfirmDel(a)}>
                  <Trash2 className="h-3 w-3" aria-hidden />
                </Button>
              </span>
            </div>
            {open && (
              <div className="mt-3 space-y-2 border-t border-gray-dark pt-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input label="العنوان" defaultValue={a.title}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== a.title
                      && patch.mutate({ id: a.id, values: { title: e.target.value.trim() } })} />
                  <Input label="التصنيف" defaultValue={a.category}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== a.category
                      && patch.mutate({ id: a.id, values: { category: e.target.value.trim() } })} />
                  <Select label="الجمهور" value={a.audience}
                    onChange={(e) => patch.mutate({ id: a.id,
                      values: { audience: e.target.value as Enums<'kb_audience'> } })}>
                    {Object.entries(AUD_AR).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <Textarea key={`${a.id}-${a.updated_at}`}
                  label="المحتوى (ماركداون — يُحفظ عند مغادرة الحقل)" rows={10}
                  defaultValue={a.body_md}
                  onBlur={(e) => e.target.value !== a.body_md
                    && patch.mutate({ id: a.id, values: { body_md: e.target.value }, msg: 'حُفظ' })} />
                <Button size="xs" variant={a.published ? 'ghost' : 'primary'}
                  onClick={() => patch.mutate({ id: a.id, values: { published: !a.published },
                    msg: a.published ? 'أُخفي عن المساعد' : 'نُشر — أعد الفهرسة ليعرفه المساعد' })}>
                  {a.published ? 'أخفِه' : 'انشره'}
                </Button>
              </div>
            )}
          </Card>
        );
      })}

      <ConfirmDialog open={confirmDel != null} title="حذف مقال المعرفة؟"
        message={`«${confirmDel?.title ?? ''}» سيُحذف وتُحذف فهرسته — المساعد لن يجيب منه بعدها.`}
        confirmLabel="احذف" danger
        onConfirm={() => { if (confirmDel) remove.mutate(confirmDel.id); }}
        onClose={() => setConfirmDel(null)} />
    </div>
  );
}

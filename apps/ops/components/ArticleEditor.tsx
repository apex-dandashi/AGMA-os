'use client';

import { useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { Badge, Button, Hint, Input, Textarea, useToast } from '@agma/ui';
import {
  ArrowRight, CheckCheck, Code2, Eye, Globe, Heading2, Image as ImageIcon,
  Link2, List, MessageSquareQuote, PanelLeft, Sparkles, SquareMousePointer,
} from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/**
 * محرر المقالات الكامل: ماركداون أو HTML مباشرة (marked يمرر HTML كما هو —
 * نفس محرك عرض الموقع فالمعاينة مطابقة)، شريط إدراج، ومساعد ذكاء يشتغل على
 * التحديد أو المقال كله بتوجيه حر — غير التوليد الجاهز.
 */

const QUICK_ACTIONS = [
  'حسّن الصياغة وقوِّ الجُمل دون تغيير المعنى',
  'أكمل الكتابة من حيث توقف النص',
  'لخّصه في خلاصة افتتاحية ٢-٣ جمل قابلة للاقتباس',
  'حوّله إلى HTML نظيف بأنماط مضمنة بسيطة',
  'اقترح ٥ عناوين بديلة أقوى للمقال',
];

const SNIPPETS: { label: string; icon: React.ReactNode; text: string }[] = [
  { label: 'عنوان فرعي', icon: <Heading2 className="h-3.5 w-3.5" aria-hidden />, text: '\n\n## العنوان الفرعي\n\n' },
  { label: 'قائمة', icon: <List className="h-3.5 w-3.5" aria-hidden />, text: '\n- النقطة الأولى\n- النقطة الثانية\n- النقطة الثالثة\n' },
  { label: 'اقتباس', icon: <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden />, text: '\n> الاقتباس هنا\n' },
  { label: 'رابط', icon: <Link2 className="h-3.5 w-3.5" aria-hidden />, text: '[نص الرابط](https://)' },
  { label: 'صورة', icon: <ImageIcon className="h-3.5 w-3.5" aria-hidden />,
    text: '\n<img src="https://" alt="وصف الصورة" style="max-width:100%;border-radius:12px;margin:16px 0" />\n' },
  { label: 'صندوق CTA', icon: <SquareMousePointer className="h-3.5 w-3.5" aria-hidden />,
    text: '\n<div style="border:1px solid rgba(232,84,47,.4);border-radius:12px;padding:20px;text-align:center;margin:24px 0">\n  <p style="font-weight:700;margin-bottom:12px">جاهز تطبّقها على عملك؟</p>\n  <a href="/contact" style="background:#E8542F;color:#0A0A0A;padding:10px 24px;border-radius:8px;font-weight:700;text-decoration:none">تواصل مع AGMA</a>\n</div>\n' },
];

export default function ArticleEditor({ article, onBack, invalidateKey }: {
  article: Tables<'articles'>;
  onBack: () => void;
  invalidateKey: string[];
}) {
  const toast = useToast();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(article.body_md ?? '');
  const [view, setView] = useState<'write' | 'preview'>('write');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiScope, setAiScope] = useState<'selection' | 'all'>('all');
  const dirty = body !== (article.body_md ?? '');

  const patch = useAppMutation(
    async ({ values, msg }: { values: Partial<Tables<'articles'>>; msg?: string }) => {
      const { error } = await getSupabase().from('articles')
        .update(values).eq('id', article.id);
      if (error) throw new Error(error.message);
      if (msg) toast.success(msg);
    },
    { invalidate: [invalidateKey] }
  );

  const saveBody = () =>
    patch.mutate({ values: { body_md: body || null }, msg: 'حُفظ النص ✓' });

  const assist = useAppMutation(
    async () => {
      const ta = bodyRef.current;
      const hasSelection = ta && ta.selectionStart !== ta.selectionEnd;
      const scope = aiScope === 'selection' && hasSelection
        ? body.slice(ta!.selectionStart, ta!.selectionEnd)
        : body;
      const { data, error } = await getSupabase().functions.invoke('assist-writing', {
        body: { instruction: aiInstruction.trim(), text: scope },
      });
      if (error) {
        const ctx = (error as { context?: unknown }).context;
        if (ctx instanceof Response) {
          const b = await ctx.json().catch(() => null);
          if (b?.message) throw new Error(b.message);
        }
        throw new Error('تعذر — حاول مجدداً');
      }
      if (!data?.ok) throw new Error(data?.message ?? 'تعذر — حاول مجدداً');
      setAiResult(data.text as string);
    },
    { invalidate: [] }
  );

  function applyAiResult(mode: 'replace' | 'append') {
    if (!aiResult) return;
    const ta = bodyRef.current;
    if (mode === 'replace') {
      if (aiScope === 'selection' && ta && ta.selectionStart !== ta.selectionEnd) {
        setBody(body.slice(0, ta.selectionStart) + aiResult + body.slice(ta.selectionEnd));
      } else {
        setBody(aiResult);
      }
    } else {
      setBody(body + '\n\n' + aiResult);
    }
    setAiResult(null);
    toast.success('طُبق — لا تنسَ الحفظ');
  }

  function insertSnippet(text: string) {
    const ta = bodyRef.current;
    if (!ta) { setBody(body + text); return; }
    const s = ta.selectionStart;
    setBody(body.slice(0, s) + text + body.slice(ta.selectionEnd));
    setView('write');
  }

  const previewHtml = useMemo(
    () => marked.parse(body || '*لا نص بعد — اكتب في تبويب التحرير*', { async: false }) as string,
    [body]
  );

  const needsReview = article.ai_generated && !article.human_reviewed_by;

  return (
    <div className="space-y-4">
      {/* الترويسة */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowRight className="h-4 w-4" aria-hidden /> عودة للقائمة
        </Button>
        <Badge variant={article.status === 'published' ? 'accent' : 'outline'}>
          {{ draft: 'مسودة', review: 'للمراجعة', published: 'منشور ✓', archived: 'مؤرشف' }[article.status]}
        </Badge>
        {article.ai_generated && (
          <Badge variant={needsReview ? 'outline' : 'neutral'}>
            {needsReview ? 'AI — بانتظار مراجعتك' : 'AI ✓ روجع'}
          </Badge>
        )}
        {dirty && <span className="text-xs text-pulse-orange">تعديلات غير محفوظة</span>}
        <span className="ms-auto flex gap-2">
          <Button size="sm" variant={dirty ? 'primary' : 'outline'} loading={patch.isPending}
            onClick={saveBody}>
            احفظ النص
          </Button>
          {needsReview && (
            <Button size="sm" variant="outline"
              onClick={async () => {
                const { data: u } = await getSupabase().auth.getUser();
                patch.mutate({ values: { human_reviewed_by: u.user?.id ?? null },
                  msg: 'وُثقت مراجعتك ✓' });
              }}>
              <CheckCheck className="h-3.5 w-3.5" aria-hidden /> راجعتُه
            </Button>
          )}
          {article.status !== 'published' && (
            <Button size="sm" variant="outline"
              onClick={() => {
                if (dirty) { toast.error('احفظ النص أولاً'); return; }
                patch.mutate({ values: { status: 'published' }, msg: 'نُشر في الموقع ✓' });
              }}>
              <Globe className="h-3.5 w-3.5" aria-hidden /> انشر
            </Button>
          )}
        </span>
      </div>

      {/* البيانات الوصفية */}
      <div className="grid gap-2 lg:grid-cols-2">
        <Input label="العنوان" defaultValue={article.title}
          onBlur={(e) => e.target.value.trim() && e.target.value !== article.title
            && patch.mutate({ values: { title: e.target.value.trim() } })} />
        <Input label="الرابط الثابت (لاتيني — يُقفل بعد النشر)" dir="ltr" defaultValue={article.slug}
          disabled={article.status === 'published'}
          onBlur={(e) => e.target.value.trim() && e.target.value !== article.slug
            && patch.mutate({ values: { slug: e.target.value.trim() } })} />
        <Input label="الخلاصة (القائمة ونتائج البحث)" defaultValue={article.excerpt ?? ''}
          onBlur={(e) => e.target.value !== (article.excerpt ?? '')
            && patch.mutate({ values: { excerpt: e.target.value || null } })} />
        <Input label="وسوم (افصل بفاصلة)" defaultValue={article.tags.join('، ')}
          onBlur={(e) => {
            const tags = e.target.value.split(/[,،]/).map((t) => t.trim()).filter(Boolean);
            if (tags.join() !== article.tags.join()) patch.mutate({ values: { tags } });
          }} />
        <Input label="عنوان SEO (≤ ٦٠ حرفاً)" defaultValue={article.seo_title ?? ''}
          onBlur={(e) => e.target.value !== (article.seo_title ?? '')
            && patch.mutate({ values: { seo_title: e.target.value || null } })} />
        <Input label="وصف SEO (≤ ١٥٥ حرفاً)" defaultValue={article.seo_description ?? ''}
          onBlur={(e) => e.target.value !== (article.seo_description ?? '')
            && patch.mutate({ values: { seo_description: e.target.value || null } })} />
      </div>

      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="xs" variant={view === 'write' ? 'primary' : 'ghost'}
          onClick={() => setView('write')}>
          <Code2 className="h-3.5 w-3.5" aria-hidden /> تحرير
        </Button>
        <Button size="xs" variant={view === 'preview' ? 'primary' : 'ghost'}
          onClick={() => setView('preview')}>
          <Eye className="h-3.5 w-3.5" aria-hidden /> معاينة كما في الموقع
        </Button>
        <span className="mx-2 h-4 w-px bg-gray-dark" aria-hidden />
        {SNIPPETS.map((s) => (
          <Button key={s.label} size="xs" variant="ghost" onClick={() => insertSnippet(s.text)}>
            {s.icon} {s.label}
          </Button>
        ))}
        <span className="ms-auto">
          <Button size="xs" variant={aiOpen ? 'primary' : 'outline'}
            onClick={() => setAiOpen(!aiOpen)}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> مساعد الكتابة
          </Button>
        </span>
      </div>

      <div className={`grid gap-4 ${aiOpen ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
        {/* المحرر / المعاينة */}
        <div>
          {view === 'write' ? (
            <Textarea aria-label="نص المقال" rows={24} value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono text-[13px] leading-6"
              placeholder={'اكتب ماركداون أو HTML مباشرة — الاثنان يُعرضان في الموقع كما هما.\n\n## مثال عنوان\nفقرة عادية…\n\n<div style="…">HTML حر</div>'}
              ref={bodyRef} />
          ) : (
            <div dir="rtl"
              className="min-h-[400px] rounded-sm border border-gray-dark p-5 text-[15px] leading-8 text-gray-light [&_a]:text-pulse-orange [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-snow [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-snow [&_li]:ms-5 [&_li]:list-disc [&_strong]:text-snow"
              dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
        </div>

        {/* مساعد الكتابة */}
        {aiOpen && (
          <div className="h-fit space-y-3 rounded-sm border border-pulse-orange/40 p-3 lg:sticky lg:top-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-pulse-orange" aria-hidden />
              مساعد الكتابة
              <Hint text="يشتغل على المقال كله أو على النص المحدد في المحرر. اكتب توجيهاً حراً أو استخدم الاختصارات — النتيجة تظهر هنا أولاً وأنت تقرر تطبيقها." />
            </p>
            <div className="flex gap-1.5 text-xs">
              <Button size="xs" variant={aiScope === 'all' ? 'primary' : 'ghost'}
                onClick={() => setAiScope('all')}>المقال كله</Button>
              <Button size="xs" variant={aiScope === 'selection' ? 'primary' : 'ghost'}
                onClick={() => setAiScope('selection')}>
                <PanelLeft className="h-3 w-3" aria-hidden /> التحديد فقط
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((q) => (
                <button key={q} type="button"
                  className="rounded-full border border-gray-dark px-2.5 py-1 text-[11px] text-gray-light transition-colors hover:border-pulse-orange hover:text-pulse-orange"
                  onClick={() => setAiInstruction(q)}>
                  {q.split(' ').slice(0, 3).join(' ')}…
                </button>
              ))}
            </div>
            <Textarea label="التوجيه" rows={3} value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="مثال: أضف قسماً عن التكلفة المتوقعة بجدول HTML" />
            <Button size="sm" className="w-full" loading={assist.isPending}
              disabled={aiInstruction.trim().length < 3}
              onClick={() => { setAiResult(null); assist.mutate(undefined as never); }}>
              نفّذ (١٠–٤٠ ثانية)
            </Button>
            {aiResult && (
              <div className="space-y-2">
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-sm border border-gray-dark p-2 text-xs leading-relaxed text-gray-light">
                  {aiResult}
                </div>
                <div className="flex gap-1.5">
                  <Button size="xs" onClick={() => applyAiResult('replace')}>
                    {aiScope === 'selection' ? 'استبدل التحديد' : 'استبدل الكل'}
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => applyAiResult('append')}>
                    أضِف للنهاية
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setAiResult(null)}>تجاهل</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

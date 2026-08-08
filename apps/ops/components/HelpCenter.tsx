'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marked } from 'marked';
import { Badge, Card, EmptyState, Input, SkeletonList } from '@agma/ui';
import { BookOpen, Bot, Search, SendHorizontal } from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

/**
 * مركز المساعدة للفريق: دليل النظام الداخلي + كل المعرفة المنشورة، بحث فوري،
 * ومساعد ذكاء بواجهة ops (جمهور كامل: عام + عملاء + داخلي). المساعد يجيب
 * موثقاً من المعرفة أو بنصيحة عامة موسومة — ولا يختلق حقائق عن AGMA.
 */

const AUD_BADGE: Record<string, string> = {
  public: 'عام', client: 'عملاء', internal: 'داخلي',
};

type Msg = { role: 'user' | 'bot'; text: string; citations?: string[]; general?: boolean };

export default function HelpCenter() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['help_center_kb'],
    queryFn: async () => {
      const { data } = await getSupabase().from('kb_articles')
        .select('id, title, category, audience, body_md')
        .eq('published', true).order('category').order('title');
      return data ?? [];
    },
  });

  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return articles ?? [];
    return (articles ?? []).filter((a) =>
      a.title.includes(needle) || a.body_md.includes(needle) || a.category.includes(needle));
  }, [articles, q]);

  const byCategory = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const a of filtered) {
      map.set(a.category, [...(map.get(a.category) ?? []), a]);
    }
    // دليل النظام أولاً — هو سبب وجود الصفحة للفريق
    return [...map.entries()].sort(([a], [b]) =>
      (a === 'دليل النظام' ? -1 : b === 'دليل النظام' ? 1 : a.localeCompare(b, 'ar')));
  }, [filtered]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-black text-snow">مركز المساعدة</h1>
        <p className="mt-1 text-sm text-gray-medium">
          دليل النظام بحسب الأقسام والأدوار، وكل المعرفة المعتمدة — ابحث أو اسأل المساعد.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section aria-label="قاعدة المعرفة">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-medium" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث في المواضيع… (مثال: النماذج، الفواتير، الأدوار)" aria-label="بحث في قاعدة المعرفة" />
          </div>

          {isLoading ? <SkeletonList rows={6} /> : byCategory.length === 0 ? (
            <EmptyState icon={<BookOpen className="h-8 w-8" aria-hidden />} title="لا نتائج"
              hint="جرب كلمة أقصر — أو اسأل المساعد مباشرة" />
          ) : byCategory.map(([cat, arts]) => (
            <div key={cat} className="mb-6">
              <h2 className="mb-2 text-sm font-bold text-pulse-orange">{cat}</h2>
              <div className="space-y-2">
                {arts.map((a) => <ArticleRow key={a.id} article={a}
                  open={openId === a.id}
                  onToggle={() => setOpenId(openId === a.id ? null : a.id)} />)}
              </div>
            </div>
          ))}
        </section>

        <AskPanel />
      </div>
    </div>
  );
}

function ArticleRow({ article, open, onToggle }: {
  article: Pick<Tables<'kb_articles'>, 'id' | 'title' | 'category' | 'audience' | 'body_md'>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="p-0">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-start focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">
        <span className="flex-1 text-sm font-medium text-snow">{article.title}</span>
        <Badge variant={article.audience === 'internal' ? 'accent' : 'neutral'}>
          {AUD_BADGE[article.audience] ?? article.audience}
        </Badge>
        <span className="text-gray-medium" aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div dir="rtl"
          className="border-t border-gray-dark px-4 py-4 text-sm leading-7 text-gray-light [&_a]:text-pulse-orange [&_a]:underline [&_h2]:mt-4 [&_h2]:font-bold [&_h2]:text-snow [&_h3]:mt-3 [&_h3]:font-bold [&_h3]:text-snow [&_li]:ms-5 [&_li]:list-disc [&_p]:mt-2 [&_strong]:text-snow"
          dangerouslySetInnerHTML={{
            __html: marked.parse(article.body_md, { async: false }) as string,
          }}
        />
      )}
    </Card>
  );
}

function AskPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'bot',
    text: 'اسألني عن أي شيء في النظام أو في التسويق — أجيب من دليل AGMA، وإن ما وجدت أعطيك نصيحة عامة موسومة.',
  }]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setDraft('');
    setBusy(true);
    const { data, error } = await getSupabase().functions.invoke('assistant-ask', {
      body: { question, surface: 'ops', website: '' },
    });
    if (error || !data?.ok) {
      setMsgs((m) => [...m, { role: 'bot', text: data?.message ?? 'تعذر الرد — أعد المحاولة.' }]);
    } else {
      setMsgs((m) => [...m, { role: 'bot', text: data.answer,
        citations: data.citations?.length ? data.citations : undefined,
        general: !!data.general }]);
    }
    setBusy(false);
    setTimeout(() => endRef.current?.scrollIntoView({ block: 'end' }), 50);
  }

  return (
    <aside aria-label="مساعد الفريق" className="lg:sticky lg:top-6 lg:self-start">
      <Card className="flex h-[520px] flex-col p-0">
        <div className="flex items-center gap-2 border-b border-gray-dark px-4 py-3">
          <Bot className="h-4 w-4 text-pulse-orange" aria-hidden />
          <span className="text-sm font-bold text-snow">مساعد AGMA — للفريق</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-end' : 'text-start'}>
              <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm leading-6 ${
                m.role === 'user'
                  ? 'bg-pulse-orange/15 text-snow'
                  : 'bg-gray-dark/60 text-gray-light'
              }`}>
                {m.general && (
                  <span className="mb-1 block text-[11px] font-bold text-pulse-orange">نصيحة عامة</span>
                )}
                {m.text}
                {m.citations && (
                  <span className="mt-1 block text-[11px] text-gray-medium">
                    المصدر: {m.citations.join(' · ')}
                  </span>
                )}
              </div>
            </div>
          ))}
          {busy && <p className="text-xs text-gray-medium">يفكر…</p>}
          <div ref={endRef} />
        </div>
        <form className="flex items-center gap-2 border-t border-gray-dark p-3"
          onSubmit={(e) => { e.preventDefault(); void ask(draft); }}>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب سؤالك…" aria-label="سؤال المساعد" />
          <button type="submit" disabled={busy || !draft.trim()} aria-label="إرسال"
            className="rounded-sm bg-pulse-orange p-2 text-void disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">
            <SendHorizontal className="h-4 w-4 -scale-x-100" aria-hidden />
          </button>
        </form>
      </Card>
    </aside>
  );
}

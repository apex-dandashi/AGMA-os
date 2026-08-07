'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  SkeletonList,
  Tabs,
  Table,
  Td,
  Textarea,
  Tr,
} from '@agma/ui';
import { CircleDot, Gauge, ListChecks, Mountain, Target } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';
import { useProfile } from './AppShell';
import { ImproveTab, PackagesTab } from './SellableTabs';

type Issue = Tables<'issues'>;
type Rock = Tables<'rocks'>;

const q = (d = new Date()) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;

export default function OsPanel() {
  const [tab, setTab] = useState('scorecard');
  return (
    <div>
      <h1 className="mb-3 text-xl font-black">نظام التشغيل</h1>
      <Tabs active={tab} onChange={setTab}
        tabs={[
          { key: 'scorecard', label: 'المؤشرات' },
          { key: 'rocks', label: 'الأولويات الربعية' },
          { key: 'issues', label: 'المشاكل والعوائق' },
          { key: 'meeting', label: 'الاجتماع الأسبوعي' },
          { key: 'packages', label: 'الباقات' },
          { key: 'improve', label: 'التحسين' },
          { key: 'vision', label: 'الرؤية' },
        ]} />
      <div className="mt-4">
        {tab === 'scorecard' && <ScorecardTab />}
        {tab === 'rocks' && <RocksTab />}
        {tab === 'issues' && <IssuesTab />}
        {tab === 'meeting' && <MeetingTab />}
        {tab === 'packages' && <PackagesTab />}
        {tab === 'improve' && <ImproveTab />}
        {tab === 'vision' && <VisionTab />}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- scorecard */

function useScorecard() {
  return useQuery({
    queryKey: ['scorecard'],
    queryFn: async () => {
      const supabase = getSupabase();
      const [metrics, entries, seats] = await Promise.all([
        supabase.from('scorecard_metrics').select('*').eq('active', true).order('sort'),
        supabase.from('scorecard_entries').select('*')
          .gte('week_start', new Date(Date.now() - 13 * 7 * 86400000).toISOString().slice(0, 10)),
        supabase.from('seats').select('*'),
      ]);
      if (metrics.error) throw new Error(metrics.error.message);
      return { metrics: metrics.data ?? [], entries: entries.data ?? [], seats: seats.data ?? [] };
    },
  });
}

function ScorecardTab() {
  const { data, isLoading } = useScorecard();
  const me = useProfile();

  const compute = useAppMutation(
    async () => {
      const { error } = await getSupabase().rpc('compute_scorecard_v3');
      if (error) throw new Error(error.message);
    },
    { invalidate: [['scorecard']], successMessage: 'حُدّثت المؤشرات' }
  );

  if (isLoading || !data) return <SkeletonList rows={6} />;

  const weeks = [...new Set(data.entries.map((e) => e.week_start))].sort().slice(-13);

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <p className="text-sm text-gray-medium">
          أرقام الأداء الأسبوعية، كل رقم له مسؤول وهدف واضح. تتحدّث تلقائياً كل
          أحد ٧ صباحاً — وأي مؤشر يبقى بالأحمر أسبوعين تُفتح له مشكلة تلقائياً.
        </p>
        {me.role === 'admin' && (
          <Button variant="outline" size="xs" className="ms-auto"
            loading={compute.isPending}
            onClick={() => compute.mutate(undefined as never)}>
            <Gauge className="h-3.5 w-3.5" aria-hidden /> احسب الآن
          </Button>
        )}
      </div>
      {me.role === 'admin' && (
        <ManualMetricEntry metrics={data.metrics.filter((m) => m.source === 'manual')} />
      )}
      {weeks.length === 0 ? (
        <EmptyState icon={<Gauge className="h-8 w-8" aria-hidden />}
          title="لا نتائج بعد"
          hint="اضغط «احسب الآن» أو انتظر أحد الساعة السابعة." />
      ) : (
        <Table head={['المؤشر', 'المقعد', 'الهدف', ...weeks.map((w) => w.slice(5))]}>
          {data.metrics.map((m) => {
            const seat = data.seats.find((s) => s.id === m.seat_id);
            return (
              <Tr key={m.key}>
                <Td className="font-medium">{m.name_ar}</Td>
                <Td className="text-gray-light">{seat?.name_ar ?? '—'}</Td>
                <Td dir="ltr" className="text-gray-medium">
                  {m.direction === 'up' ? '≥' : '≤'} {m.green_threshold ?? '؟'}
                </Td>
                {weeks.map((w) => {
                  const e = data.entries.find(
                    (x) => x.metric_key === m.key && x.week_start === w
                  );
                  return (
                    <Td key={w} dir="ltr">
                      {e ? (
                        <span className={e.is_green ? 'text-gray-light' : 'font-bold text-pulse-orange'}>
                          {Number(e.value).toLocaleString('en-US')}
                        </span>
                      ) : (
                        <span className="text-gray-dark">·</span>
                      )}
                    </Td>
                  );
                })}
              </Tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}

/** Monday of the current week — matches Postgres date_trunc('week'). */
function currentWeekStart(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

/** Manual metrics (NPS وأمثالها) have no cron — the number is typed here. */
function ManualMetricEntry({ metrics }: { metrics: Tables<'scorecard_metrics'>[] }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const week = currentWeekStart();

  const save = useAppMutation(
    async () => {
      const metric = metrics.find((m) => m.key === key);
      if (!metric) throw new Error('اختر المؤشر');
      const v = Number(value);
      const green = metric.direction === 'up'
        ? v >= Number(metric.green_threshold ?? 0)
        : v <= Number(metric.green_threshold ?? 0);
      const { error } = await getSupabase().from('scorecard_entries').upsert({
        metric_key: key, week_start: week, value: v, is_green: green,
      }, { onConflict: 'metric_key,week_start' });
      if (error) throw new Error(error.message);
    },
    { invalidate: [['scorecard']], successMessage: 'سُجّلت القيمة لهذا الأسبوع' }
  );

  if (metrics.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
      <Select label="مؤشر يدوي" value={key} onChange={(e) => setKey(e.target.value)} className="w-48">
        <option value="">— اختر —</option>
        {metrics.map((m) => <option key={m.key} value={m.key}>{m.name_ar}</option>)}
      </Select>
      <Input label={`قيمة أسبوع ${week.slice(5)}`} type="number" dir="ltr" value={value}
        onChange={(e) => setValue(e.target.value)} className="w-32" />
      <Button size="sm" className="mb-0.5" loading={save.isPending}
        disabled={!key || value === ''}
        onClick={() => save.mutate(undefined as never)}>
        سجّل
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ rocks */

const ROCK_STATUS: Record<Enums<'rock_status'>, string> = {
  on_track: 'على المسار',
  off_track: 'خارج المسار',
  done: 'أُنجزت',
  dropped: 'أُسقطت',
};

function RocksTab() {
  const me = useProfile();
  const [quarter, setQuarter] = useState(q());
  const rocksKey = ['rocks', quarter];
  const { data: rocks, isLoading } = useQuery({
    queryKey: rocksKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('rocks').select('*').eq('quarter', quarter).order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const { data: team } = useQuery({
    queryKey: ['team-list'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('profiles').select('id, full_name, email').neq('role', 'client');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [title, setTitle] = useState('');
  const [criteria, setCriteria] = useState('');

  const add = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('rocks').insert({
        quarter, owner: me.id, title, success_criteria: criteria || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [rocksKey], successMessage: 'أُضيفت الأولوية' }
  );

  const setStatus = useAppMutation(
    async ({ rock, status }: { rock: Rock; status: Enums<'rock_status'> }) => {
      const { error } = await getSupabase().from('rocks').update({ status }).eq('id', rock.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [rocksKey] }
  );

  if (isLoading) return <SkeletonList rows={4} />;

  return (
    <div>
      <p className="mb-2 text-sm text-gray-medium">
        أهم ٣–٥ أهداف للربع الحالي — لكل هدف مسؤول واحد وموعد واضح، وتُراجع
        كل أسبوعين. ما ليس هنا ليس أولوية.
      </p>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Select label="الربع" value={quarter} onChange={(e) => setQuarter(e.target.value)}
          className="w-32">
          {[0, 1, 2].map((i) => {
            const d = new Date();
            d.setMonth(d.getMonth() + i * 3);
            const v = q(d);
            return <option key={v} value={v}>{v}</option>;
          })}
        </Select>
        <div className="min-w-44 flex-1">
          <Input label="أولوية جديدة (مسؤوليتك أنت)" value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="أولوية التسعين يوماً" />
        </div>
        <div className="min-w-44 flex-1">
          <Input label="معيار النجاح" value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="متى تُعد منجزة؟ (نعم/لا، بلا أنصاف)" />
        </div>
        <Button size="sm" loading={add.isPending} disabled={!title.trim()}
          onClick={() => { add.mutate(undefined as never); setTitle(''); setCriteria(''); }}>
          + أولوية
        </Button>
      </div>
      {(rocks ?? []).length === 0 ? (
        <EmptyState icon={<Mountain className="h-8 w-8" aria-hidden />}
          title={`لا صخور لربع ${quarter}`}
          hint="3–5 أولويات لكل شريك — والنظام يرفض السادسة." />
      ) : (
        <div className="space-y-2">
          {(rocks ?? []).map((rock) => {
            const owner = (team ?? []).find((t) => t.id === rock.owner);
            const mine = rock.owner === me.id;
            return (
              <Card key={rock.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <Badge variant={
                  rock.status === 'done' ? 'accent'
                  : rock.status === 'off_track' ? 'accent' : 'neutral'
                }>
                  {ROCK_STATUS[rock.status]}
                </Badge>
                <span className={`font-bold ${rock.status === 'done' ? 'line-through opacity-60' : ''}`}>
                  {rock.title}
                </span>
                {rock.success_criteria && (
                  <span className="text-xs text-gray-medium">{rock.success_criteria}</span>
                )}
                <span className="ms-auto text-xs text-gray-light">
                  {owner?.full_name || owner?.email}
                </span>
                {(mine || me.role === 'admin') && rock.status !== 'done' && rock.status !== 'dropped' && (
                  <span className="flex gap-1">
                    <Button variant="ghost" size="xs"
                      onClick={() => setStatus.mutate({
                        rock,
                        status: rock.status === 'on_track' ? 'off_track' : 'on_track',
                      })}>
                      {rock.status === 'on_track' ? 'خارج المسار؟' : 'عاد للمسار'}
                    </Button>
                    <Button variant="outline" size="xs"
                      onClick={() => setStatus.mutate({ rock, status: 'done' })}>
                      أُنجزت
                    </Button>
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- issues */

const ISSUE_STATUS: Record<Enums<'issue_status'>, string> = {
  identified: 'مرصودة',
  discussing: 'قيد النقاش',
  solved: 'محلولة',
  dropped: 'أُسقطت',
};

function IssuesTab() {
  const issuesKey = ['issues'];
  const { data: issues, isLoading } = useQuery({
    queryKey: issuesKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('issues').select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [title, setTitle] = useState('');
  const [solving, setSolving] = useState<Issue | null>(null);
  const [showSolved, setShowSolved] = useState(false);

  const raise = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('issues').insert({ title });
      if (error) throw new Error(error.message);
    },
    { invalidate: [issuesKey], successMessage: 'سُجّلت المشكلة' }
  );

  const open = (issues ?? []).filter((i) => i.status === 'identified' || i.status === 'discussing');
  const closed = (issues ?? []).filter((i) => i.status === 'solved' || i.status === 'dropped');

  if (isLoading) return <SkeletonList rows={4} />;

  return (
    <div>
      <p className="mb-2 text-sm text-gray-medium">
        كل ما يعطّل الشغل يُكتب هنا فور ملاحظته — عميل متأخر، أداة معطلة، خلاف
        على أولوية. تُناقش أهم ٣ في اجتماع الأسبوع، ولا تُغلق مشكلة إلا بمعرفة
        سببها الحقيقي.
      </p>
      <form className="mb-3 flex gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (!title.trim()) return;
          raise.mutate(undefined as never);
          setTitle('');
        }}>
        <div className="flex-1">
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="أي أحد يسجّل أي مشكلة — الخطأ إخفاؤها، لا وجودها" />
        </div>
        <Button type="submit" size="sm" loading={raise.isPending}>+ مشكلة</Button>
      </form>

      {open.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-8 w-8" aria-hidden />}
          title="لا قضايا مفتوحة"
          hint="القائمة الفارغة طويلاً إشارة صمت لا إشارة صحة." />
      ) : (
        <div className="space-y-2">
          {open.map((issue) => (
            <Card key={issue.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <Badge variant={issue.priority >= 4 ? 'accent' : 'neutral'}>
                أولوية {issue.priority}
              </Badge>
              <span className="font-bold">{issue.title}</span>
              {issue.auto_filed && <Badge variant="outline">آلية</Badge>}
              {issue.original_id && <Badge variant="accent">متكررة</Badge>}
              <Badge variant="outline">{ISSUE_STATUS[issue.status]}</Badge>
              <span className="ms-auto flex gap-1">
                {issue.status === 'identified' && (
                  <Button variant="ghost" size="xs"
                    onClick={() => solveStatus(issue.id, 'discussing', issuesKey)}>
                    للنقاش
                  </Button>
                )}
                <Button variant="outline" size="xs" onClick={() => setSolving(issue)}>
                  ناقشها وحلّها
                </Button>
              </span>
            </Card>
          ))}
        </div>
      )}

      <button onClick={() => setShowSolved((v) => !v)}
        className="mt-4 text-xs text-gray-medium hover:text-snow">
        {showSolved ? 'إخفاء المحلولة' : `المحلولة (${closed.length})`}
      </button>
      {showSolved && (
        <div className="mt-2 space-y-1.5 opacity-70">
          {closed.map((i) => (
            <Card key={i.id} className="p-2.5 text-sm">
              <span className="font-medium">{i.title}</span>
              {i.root_cause && (
                <p className="mt-1 text-xs text-gray-medium">الجذر: {i.root_cause}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <SolveModal issue={solving} onClose={() => setSolving(null)} issuesKey={issuesKey} />
    </div>
  );
}

async function solveStatus(id: string, status: Enums<'issue_status'>, _key: unknown) {
  await getSupabase().from('issues').update({ status }).eq('id', id);
}

function SolveModal({ issue, onClose, issuesKey }:
  { issue: Issue | null; onClose: () => void; issuesKey: readonly string[] }) {
  const [rootCause, setRootCause] = useState('');
  const solve = useAppMutation(
    async () => {
      if (!issue) return;
      const { error } = await getSupabase().from('issues')
        .update({ status: 'solved', root_cause: rootCause }).eq('id', issue.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [issuesKey], successMessage: 'حُلّت — الجذر موثّق' }
  );

  return (
    <Modal open={!!issue} onClose={onClose} title={`حلّ: ${issue?.title ?? ''}`}>
      <div className="space-y-3">
        <Textarea label="السبب الجذري (إلزامي — لا تُغلق المشكلة بعلاج العرَض)"
          rows={3} value={rootCause} onChange={(e) => setRootCause(e.target.value)}
          placeholder="لماذا حدثت فعلاً؟ وما الذي تغيّر كي لا تتكرر؟" />
        <Button size="sm" className="w-full" loading={solve.isPending}
          disabled={rootCause.trim().length < 5}
          onClick={async () => {
            await solve.mutateAsync(undefined as never);
            setRootCause('');
            onClose();
          }}>
          إغلاق بالجذر
        </Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- meeting */

function MeetingTab() {
  const { data: sc } = useScorecard();
  const rocksQ = q();
  const { data: rocks } = useQuery({
    queryKey: ['rocks', rocksQ],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('rocks').select('*').eq('quarter', rocksQ);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const { data: issues } = useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('issues').select('*')
        .in('status', ['identified', 'discussing'])
        .order('priority', { ascending: false }).limit(20);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const todosKey = ['meeting-todos'];
  const { data: todos } = useQuery({
    queryKey: todosKey,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('meeting_todos').select('*')
        .order('created_at', { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [todo, setTodo] = useState('');
  const [rating, setRating] = useState(8);

  const addTodo = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('meeting_todos').insert({ title: todo });
      if (error) throw new Error(error.message);
    },
    { invalidate: [todosKey] }
  );
  const toggleTodo = useAppMutation(
    async (t: Tables<'meeting_todos'>) => {
      const { error } = await getSupabase().from('meeting_todos')
        .update({ done_at: t.done_at ? null : new Date().toISOString() }).eq('id', t.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [todosKey] }
  );
  const conclude = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('meetings')
        .insert({ kind: 'l10', rating });
      if (error) throw new Error(error.message);
    },
    { invalidate: [], successMessage: 'سُجّل الاجتماع — نلتقي الأسبوع القادم' }
  );

  const latestWeek = [...new Set((sc?.entries ?? []).map((e) => e.week_start))].sort().at(-1);
  const reds = (sc?.entries ?? []).filter((e) => e.week_start === latestWeek && !e.is_green);
  const openTodos = (todos ?? []).filter((t) => !t.done_at);
  const doneTodos = (todos ?? []).filter((t) => t.done_at);
  const donePct = (todos ?? []).length
    ? Math.round((doneTodos.length / (todos ?? []).length) * 100) : 100;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <p className="text-sm text-gray-medium">
        اجتماع أسبوعي ثابت بنفس اليوم والساعة، ٩٠ دقيقة بجدول جاهز — النظام
        يحضّر الأرقام والقوائم، وأنتما تناقشان وتقرران فقط. (تحديد يوم
        الاجتماع: قرار شركاء)
      </p>

      <MeetingSection n="١" title="الافتتاح — خبر جيد واحد لكل شريك (٥ د)" />
      <MeetingSection n="٢" title={`المؤشرات — ${reds.length} بالأحمر (٥ د)`}>
        {reds.length === 0 ? (
          <p className="text-sm text-gray-light">كل المؤشرات خضراء هذا الأسبوع.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {reds.map((e) => {
              const m = sc?.metrics.find((x) => x.key === e.metric_key);
              return (
                <li key={e.metric_key} className="text-pulse-orange">
                  <CircleDot className="-mt-0.5 me-1 inline h-3 w-3" aria-hidden />
                  {m?.name_ar}: <b dir="ltr">{Number(e.value).toLocaleString('en-US')}</b>
                </li>
              );
            })}
          </ul>
        )}
      </MeetingSection>
      <MeetingSection n="٣" title="الأولويات الربعية — هل هي على المسار؟ (٥ د)">
        <ul className="space-y-1 text-sm">
          {(rocks ?? []).map((r) => (
            <li key={r.id} className={r.status === 'off_track' ? 'text-pulse-orange' : 'text-gray-light'}>
              {r.title} — {ROCK_STATUS[r.status]}
            </li>
          ))}
          {(rocks ?? []).length === 0 && (
            <li className="text-gray-medium">لا صخور لهذا الربع — حددا 3–5 لكل شريك.</li>
          )}
        </ul>
      </MeetingSection>
      <MeetingSection n="٤" title={`مهام الأسبوع الماضي — ${donePct}% (الهدف ≥90%) (٥ د)`}>
        <div className="space-y-1.5">
          {openTodos.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm text-gray-light">
              <input type="checkbox" checked={false}
                onChange={() => toggleTodo.mutate(t)}
                className="h-4 w-4 accent-[#F44D2B]" />
              {t.title}
              <span dir="ltr" className="text-xs text-gray-medium">{t.due}</span>
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <div className="flex-1">
              <Input value={todo} onChange={(e) => setTodo(e.target.value)}
                placeholder="مهمة ٧ أيام جديدة…" />
            </div>
            <Button size="sm" disabled={!todo.trim()} loading={addTodo.isPending}
              onClick={() => { addTodo.mutate(undefined as never); setTodo(''); }}>
              +
            </Button>
          </div>
        </div>
      </MeetingSection>
      <MeetingSection n="٥" title={`أهم ٣ مشاكل — حدِّد، ناقش، حُلّ (٦٠ د)`}>
        <ul className="space-y-1 text-sm">
          {(issues ?? []).slice(0, 3).map((i) => (
            <li key={i.id} className="font-medium">
              <Target className="-mt-0.5 me-1 inline h-3 w-3 text-pulse-orange" aria-hidden />
              {i.title}
            </li>
          ))}
          {(issues ?? []).length === 0 && (
            <li className="text-gray-medium">لا قضايا مفتوحة.</li>
          )}
        </ul>
        <p className="mt-1 text-xs text-gray-medium">الحل من تبويب «المشاكل والعوائق» — كتابة السبب الجذري إلزامية قبل الإغلاق.</p>
      </MeetingSection>
      <MeetingSection n="٦" title="الختام — قيّم الاجتماع (٥ د)">
        <div className="flex items-center gap-2">
          <Input type="number" dir="ltr" min={1} max={10} value={rating}
            onChange={(e) => setRating(Number(e.target.value))} className="w-20"
            aria-label="تقييم الاجتماع من 10" />
          <span className="text-xs text-gray-medium">/ 10 (الهدف ≥ 8)</span>
          <Button size="sm" className="ms-auto" loading={conclude.isPending}
            onClick={() => conclude.mutate(undefined as never)}>
            اختتام وتسجيل
          </Button>
        </div>
      </MeetingSection>
    </div>
  );
}

function MeetingSection({ n, title, children }:
  { n: string; title: string; children?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-sm font-bold">
        <span className="text-pulse-orange">{n}</span> · {title}
      </h3>
      {children}
    </Card>
  );
}

/* ----------------------------------------------------------------- vision */

/**
 * الغاية الأساسية (E-Myth، docs/10 §2.1.1): what life must this company buy
 * you? RLS is owner-only — each partner sees and edits only their own row.
 * Root node of every annual plan; revisited yearly.
 */
function PrimaryAimCard({ meId }: { meId: string }) {
  const aimKey = ['primary-aim', meId];
  const { data, isLoading } = useQuery({
    queryKey: aimKey,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('primary_aims').select('*').maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState('');
  const [excerpt, setExcerpt] = useState('');

  const save = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('primary_aims').upsert({
        profile_id: meId,
        statement: statement.trim(),
        shared_excerpt: excerpt.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
      if (error) throw new Error(error.message);
    },
    { invalidate: [aimKey], successMessage: 'حُفظت الغاية — تُراجع سنوياً' }
  );

  if (isLoading) return null;
  return (
    <Card className="border-pulse-orange/30 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Target className="h-4 w-4 text-pulse-orange" aria-hidden />
        <h3 className="font-bold">غايتك الأساسية (خاص بك — لا يراه أحد غيرك)</h3>
        <Button variant="ghost" size="xs" className="ms-auto"
          onClick={() => {
            setStatement(data?.statement ?? '');
            setExcerpt(data?.shared_excerpt ?? '');
            setEditing((v) => !v);
          }}>
          {editing ? 'إغلاق' : data ? 'تعديل' : 'اكتبها'}
        </Button>
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea label="أي حياة يجب أن تشتريها لك هذه الشركة؟" rows={3}
            value={statement} onChange={(e) => setStatement(e.target.value)} />
          <Textarea label="مقتطف تشاركه مع شريكك (اختياري)" rows={2}
            value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          <Button size="sm" loading={save.isPending} disabled={statement.trim().length < 10}
            onClick={async () => {
              await save.mutateAsync(undefined as never);
              setEditing(false);
            }}>
            حفظ
          </Button>
        </div>
      ) : data ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-light">{data.statement}</p>
      ) : (
        <p className="text-sm text-gray-medium">
          الجذر الذي تُقاس عليه كل خطة سنوية وكل «هل نقبل هذا العميل؟» — لم تُكتب بعد.
        </p>
      )}
    </Card>
  );
}

function VisionTab() {
  const me = useProfile();
  const visionKey = ['vision'];
  const { data, isLoading } = useQuery({
    queryKey: visionKey,
    queryFn: async () => {
      const supabase = getSupabase();
      const [vision, seats, team] = await Promise.all([
        supabase.from('vision').select('*').single(),
        supabase.from('seats').select('*').order('sort'),
        supabase.from('profiles').select('id, full_name, email').neq('role', 'client'),
      ]);
      if (vision.error) throw new Error(vision.error.message);
      return { vision: vision.data, seats: seats.data ?? [], team: team.data ?? [] };
    },
  });

  const assignSeat = useAppMutation(
    async ({ seatId, holder }: { seatId: string; holder: string | null }) => {
      const { error } = await getSupabase().from('seats')
        .update({ holder }).eq('id', seatId);
      if (error) throw new Error(error.message);
    },
    { invalidate: [visionKey], successMessage: 'حُدّث المقعد' }
  );

  if (isLoading || !data) return <SkeletonList rows={5} />;
  const v = data.vision;
  const values = (v.core_values as string[]) ?? [];
  const focus = (v.core_focus as { purpose?: string; niche?: string }) ?? {};

  return (
    <div className="space-y-6">
      {me.role === 'admin' && <PrimaryAimCard meId={me.id} />}
      <Card className="p-4">
        <h3 className="mb-2 font-bold text-pulse-orange">القيم الجوهرية</h3>
        <ul className="space-y-1 text-sm text-gray-light">
          {values.map((val, i) => <li key={i}>• {val}</li>)}
        </ul>
        <h3 className="mb-1 mt-4 font-bold text-pulse-orange">التركيز الجوهري</h3>
        <p className="text-sm text-gray-light">الغاية: {focus.purpose ?? '—'}</p>
        <p className="text-sm text-gray-light">التخصص: {focus.niche ?? '—'}</p>
        <h3 className="mb-1 mt-4 font-bold text-pulse-orange">الهدف العشري</h3>
        <p className="text-sm text-gray-light">{v.ten_year_target ?? '—'}</p>
        <p className="mt-3 text-xs text-gray-medium">
          العناصر الموسومة «قرار شركاء» تُقفل في جلسة الشركاء (docs/10 Part 5).
        </p>
      </Card>

      <div>
        <h3 className="mb-2 font-bold text-gray-light">خريطة المساءلة — اسم واحد لكل مقعد</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.seats.map((seat) => {
            const holder = data.team.find((t) => t.id === seat.holder);
            return (
              <Card key={seat.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{seat.name_ar}</span>
                  <Badge variant={seat.holder ? 'accent' : 'outline'}>
                    {holder ? (holder.full_name || holder.email) : 'شاغر'}
                  </Badge>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-gray-medium">
                  {((seat.roles as string[]) ?? []).map((r, i) => <li key={i}>· {r}</li>)}
                </ul>
                {me.role === 'admin' && (
                  <Select value={seat.holder ?? ''} aria-label={`شاغل مقعد ${seat.name_ar}`}
                    onChange={(e) =>
                      assignSeat.mutate({ seatId: seat.id, holder: e.target.value || null })}
                    className="mt-2 py-1 text-xs">
                    <option value="">— شاغر —</option>
                    {data.team.map((t) => (
                      <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
                    ))}
                  </Select>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Card, EmptyState, Hint, SkeletonList, Table, Td, Tr } from '@agma/ui';
import { Activity, BarChart3, HeartPulse, Users } from 'lucide-react';
import type { Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

/**
 * التحليلات (docs/04 §3.1 + docs/05 B11.6): لوحة الإدارة — النقد الشهري،
 * قمع المبيعات، صحة العملاء (خطر الفقد المبكر)، وأحمال الفريق. الأرقام
 * تُقرأ من مصادرها مباشرة فلا تتعارض مع شاشات الأقسام.
 */

const STAGE_AR: Record<string, string> = {
  discovery_call: 'مكالمة استكشاف', opportunity_analysis: 'تحليل الفرصة',
  scoping: 'تحديد النطاق', roadmap: 'خارطة الطريق', live: 'تشغيل', optimize: 'تحسين',
};

const BAND = {
  green: { ar: 'أخضر', cls: 'text-green-500' },
  amber: { ar: 'أصفر', cls: 'text-yellow-500' },
  red: { ar: 'أحمر', cls: 'text-pulse-orange' },
} as const;

const COMPONENT_AR: Record<string, string> = {
  approvals: 'سرعة الاعتماد', payments: 'انضباط الدفع',
  engagement: 'التفاعل', csat: 'الرضا',
};

function monthKey(d: string): string {
  return d.slice(0, 7);
}

export default function AnalyticsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const s = getSupabase();
      const since = new Date();
      since.setMonth(since.getMonth() - 11);
      since.setDate(1);
      const [pays, leads, healthRes, clients, tasks, profiles] = await Promise.all([
        s.from('payments').select('amount, paid_on')
          .gte('paid_on', since.toISOString().slice(0, 10)),
        s.from('leads').select('stage, value').eq('outcome', 'open'),
        s.from('client_health').select('*')
          .order('week_start', { ascending: false })
          .returns<Tables<'client_health'>[]>(),
        s.from('clients').select('id, company'),
        s.from('tasks').select('assignee').neq('status', 'done').not('assignee', 'is', null),
        s.from('profiles').select('id, full_name, email').neq('role', 'client'),
      ]);
      const health = (healthRes.data ?? []) as Tables<'client_health'>[];
      // أحدث أسبوع لكل عميل فقط
      const names = new Map((clients.data ?? []).map((c) => [c.id, c.company]));
      const latest = new Map<string, Tables<'client_health'> & { company: string }>();
      for (const h of health) {
        if (!latest.has(h.client_id)) {
          latest.set(h.client_id, { ...h, company: names.get(h.client_id) ?? '—' });
        }
      }
      return {
        pays: pays.data ?? [], leads: leads.data ?? [],
        health: [...latest.values()].sort((a, b) => a.score - b.score),
        tasks: tasks.data ?? [], profiles: profiles.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <SkeletonList rows={8} />;

  // النقد شهرياً (١٢ شهراً)
  const byMonth = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    byMonth.set(d.toISOString().slice(0, 7), 0);
  }
  for (const p of data.pays) {
    const k = monthKey(p.paid_on);
    if (byMonth.has(k)) byMonth.set(k, (byMonth.get(k) ?? 0) + Number(p.amount));
  }
  const months = [...byMonth.entries()];
  const maxCash = Math.max(...months.map(([, v]) => v), 1);

  // قمع المبيعات
  const funnel = Object.keys(STAGE_AR).map((st) => {
    const rows = data.leads.filter((l) => l.stage === st);
    return { stage: st, count: rows.length, value: rows.reduce((a, l) => a + Number(l.value ?? 0), 0) };
  });
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  // أحمال الفريق
  const load = new Map<string, number>();
  for (const t of data.tasks) load.set(t.assignee!, (load.get(t.assignee!) ?? 0) + 1);
  const loads = [...load.entries()]
    .map(([id, n]) => ({
      name: data.profiles.find((p) => p.id === id)?.full_name
        || data.profiles.find((p) => p.id === id)?.email || '—',
      n,
    }))
    .sort((a, b) => b.n - a.n);
  const maxLoad = Math.max(...loads.map((l) => l.n), 1);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-black text-snow">التحليلات</h1>
        <p className="mt-1 text-sm text-gray-medium">
          الشركة بالأرقام: النقد، المسار، صحة العملاء، والأحمال — من مصادرها مباشرة.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-snow">
            <BarChart3 className="h-4 w-4 text-pulse-orange" aria-hidden />
            النقد المحصل شهرياً (SAR)
          </h2>
          <div className="flex h-36 items-end gap-1" dir="ltr" role="img"
            aria-label="النقد المحصل آخر ١٢ شهراً">
            {months.map(([m, v]) => (
              <div key={m} className="group flex flex-1 flex-col items-center gap-1">
                <span className="hidden text-[9px] text-gray-medium group-hover:block">
                  {Math.round(v).toLocaleString('en-US')}
                </span>
                <div className="w-full rounded-t-sm bg-pulse-orange/70 transition-colors group-hover:bg-pulse-orange"
                  style={{ height: `${Math.max(2, (v / maxCash) * 100)}%` }} />
                <span className="text-[9px] text-gray-medium">{m.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-snow">
            <Activity className="h-4 w-4 text-pulse-orange" aria-hidden />
            قمع المبيعات المفتوح
          </h2>
          <div className="space-y-2">
            {funnel.map((f) => (
              <div key={f.stage} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 text-gray-light">{STAGE_AR[f.stage]}</span>
                <div className="h-4 flex-1 rounded-sm bg-gray-dark/50">
                  <div className="h-full rounded-sm bg-pulse-orange/60"
                    style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
                </div>
                <span className="w-24 shrink-0 text-end text-gray-medium" dir="ltr">
                  {f.count} · {Math.round(f.value).toLocaleString('en-US')}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-snow">
            <HeartPulse className="h-4 w-4 text-pulse-orange" aria-hidden />
            صحة العملاء
            <Hint text="درجة أسبوعية من ١٠٠: سرعة الاعتماد + انضباط الدفع + التفاعل + الرضا. الأحمر = خطر فقد مبكر، تحرك قبل أن يتصل هو. معلومة داخلية لا يراها العميل أبداً." />
          </h2>
          {data.health.length === 0 ? (
            <EmptyState icon={<HeartPulse className="h-8 w-8" aria-hidden />}
              title="لا حسابات بعد"
              hint="تُحسب كل أحد مع المؤشرات — أو من «النظام → المؤشرات → احسب الآن»." />
          ) : (
            <Table head={['العميل', 'الدرجة', 'النطاق', 'المكونات', 'الأسبوع']}>
              {data.health.map((h) => (
                <Tr key={h.client_id}>
                  <Td className="font-medium">{h.company}</Td>
                  <Td dir="ltr" className={`font-bold ${BAND[h.band as keyof typeof BAND].cls}`}>
                    {h.score}
                  </Td>
                  <Td>
                    <Badge variant={h.band === 'red' ? 'accent' : 'neutral'}>
                      {BAND[h.band as keyof typeof BAND].ar}
                    </Badge>
                  </Td>
                  <Td className="text-xs text-gray-medium">
                    {Object.entries((h.components ?? {}) as Record<string, number>)
                      .map(([k, v]) => `${COMPONENT_AR[k] ?? k}: ${Math.round(v)}`)
                      .join(' · ') || '—'}
                  </Td>
                  <Td dir="ltr" className="text-gray-medium">{h.week_start}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-snow">
            <Users className="h-4 w-4 text-pulse-orange" aria-hidden />
            أحمال الفريق (مهام مفتوحة)
          </h2>
          {loads.length === 0 ? (
            <p className="text-sm text-gray-medium">لا مهام مفتوحة مسندة حالياً.</p>
          ) : (
            <div className="space-y-2">
              {loads.map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-xs">
                  <span className="w-36 shrink-0 truncate text-gray-light">{l.name}</span>
                  <div className="h-4 flex-1 rounded-sm bg-gray-dark/50">
                    <div className="h-full rounded-sm bg-pulse-orange/60"
                      style={{ width: `${(l.n / maxLoad) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-end text-gray-medium" dir="ltr">{l.n}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

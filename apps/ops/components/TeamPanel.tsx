'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Hint, Input, Select, SkeletonList, Table, Td, Tr, useToast } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation } from '../lib/queries';

/**
 * الأدوار هنا «مستويات صلاحية» أمنية ثلاثية (كلٌّ يشمل ما تحته) — أما
 * الوظيفة الفعلية فمن «المسمى الوظيفي» و«المقاعد» (هيكل EOS في النظام ← الرؤية).
 */
const ROLE_LABELS: Record<Enums<'user_role'>, string> = {
  admin: 'شريك',
  cfo: 'مدير مالي',
  accountant: 'محاسب',
  legal: 'مستشار قانوني',
  auditor: 'مدقق حوكمة',
  strategist: 'مدير عمليات',
  executor: 'عضو تنفيذ',
  client: 'عميل',
};

const MATRIX_ROLES = ['admin', 'cfo', 'accountant', 'legal', 'auditor', 'strategist', 'executor'] as const;
const ROLE_MATRIX: { cap: string; roles: Record<(typeof MATRIX_ROLES)[number], boolean> }[] = [
  { cap: 'قراءة شاملة لكل السجلات',
    roles: { admin: true, cfo: true, accountant: true, legal: true, auditor: true, strategist: true, executor: false } },
  { cap: 'مهامه: تنفيذ وتعليق وتسجيل وقت ورفع ملفات',
    roles: { admin: true, cfo: true, accountant: true, legal: true, auditor: false, strategist: true, executor: true } },
  { cap: 'المبيعات والعملاء والمستندات والمشاريع',
    roles: { admin: true, cfo: true, accountant: true, legal: true, auditor: false, strategist: true, executor: false } },
  { cap: 'اعتماد وترقيم الفواتير وتسجيل الدفعات والمصروفات',
    roles: { admin: true, cfo: true, accountant: true, legal: false, auditor: false, strategist: true, executor: false } },
  { cap: 'المالية الحساسة: الحسابات البنكية، نسب التوزيع، تأكيد الجولات، توزيع الأرباح',
    roles: { admin: true, cfo: true, accountant: false, legal: false, auditor: false, strategist: false, executor: false } },
  { cap: 'مكتبة البنود القانونية وقوالب العقود',
    roles: { admin: true, cfo: false, accountant: false, legal: true, auditor: false, strategist: false, executor: false } },
  { cap: 'اعتماد المستندات عند طلب مراجعته (كلٌّ في تخصصه)',
    roles: { admin: true, cfo: true, accountant: true, legal: true, auditor: true, strategist: false, executor: false } },
  { cap: 'الفريق: دعوات وأدوار وتقييم ربعي وتكلفة/س',
    roles: { admin: true, cfo: false, accountant: false, legal: false, auditor: false, strategist: false, executor: false } },
];

export default function TeamPanel({ me }: { me: Tables<'profiles'> }) {
  const isAdmin = me.role === 'admin';
  const toast = useToast();
  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('profiles').select('*').order('created_at');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const { data: seats } = useQuery({
    queryKey: ['team-seats'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('seats').select('id, name_ar, holder').order('sort');
      if (error) throw new Error(error.message);
      return data;
    },
  });
  // Workload heatmap-lite (docs/04 §1.6): open tasks per member.
  const { data: workload } = useQuery({
    queryKey: ['workload'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('tasks')
        .select('assignee')
        .neq('status', 'done')
        .not('assignee', 'is', null);
      if (error) throw new Error(error.message);
      const counts = new Map<string, number>();
      for (const t of data ?? []) {
        counts.set(t.assignee!, (counts.get(t.assignee!) ?? 0) + 1);
      }
      return counts;
    },
  });

  const updateHr = useAppMutation(
    async ({ id, patch }: { id: string; patch: Partial<Tables<'profiles'>> }) => {
      const { error } = await getSupabase().from('profiles').update(patch as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [['profiles']], successMessage: 'حُدّث السجل' }
  );

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Exclude<Enums<'user_role'>, 'client'>>('strategist');
  const [inviting, setInviting] = useState(false);

  const changeRole = useAppMutation(
    async ({ id, newRole }: { id: string; newRole: Enums<'user_role'> }) => {
      const { error } = await getSupabase().from('profiles').update({ role: newRole }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [['profiles']], successMessage: 'حُدّث الدور' }
  );

  async function invite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const { data: session } = await getSupabase().auth.getSession();
      const token = session.session?.access_token;
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://gjaheqlgheizvebvakfd.supabase.co';
      const res = await fetch(`${base}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role, full_name: fullName }),
      });
      if (!res.ok) throw new Error('invite failed');
      toast.success('أُرسلت الدعوة بالبريد');
      setEmail('');
      setFullName('');
      refetch();
    } catch {
      toast.error('تعذر إرسال الدعوة');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-black">الفريق</h1>

      {isAdmin && (
        <form onSubmit={invite} className="mb-5 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
          <Input label="البريد الإلكتروني" dir="ltr" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} className="w-64" />
          <Input label="الاسم" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-48" />
          <Select label="مستوى الصلاحية" value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="strategist">مدير عمليات</option>
            <option value="executor">عضو تنفيذ</option>
            <option value="cfo">مدير مالي</option>
            <option value="accountant">محاسب</option>
            <option value="legal">مستشار قانوني</option>
            <option value="auditor">مدقق حوكمة</option>
            <option value="admin">شريك</option>
          </Select>
          <Button type="submit" size="sm" loading={inviting}>دعوة</Button>
        </form>
      )}

      {isAdmin && <RoleMatrixCard />}

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <Table head={[
          'الاسم', 'البريد',
          <span key="r" className="inline-flex items-center gap-1">مستوى الصلاحية
            <Hint wide text="أدوار يفرضها النظام على مستوى قاعدة البيانات: شريك (كل شيء) · مدير مالي (التشغيل + المالية الحساسة) · محاسب (التشغيل المالي دون الحسابات البنكية وتأكيد الجولات) · مستشار قانوني (التشغيل + مكتبة البنود) · مدقق حوكمة (قراءة شاملة فقط) · مدير عمليات · عضو تنفيذ. افتح «ماذا يستطيع كل دور؟» للمصفوفة الكاملة." /></span>,
          'المسمى الوظيفي',
          <span key="s" className="inline-flex items-center gap-1">المقاعد
            <Hint text="مقاعد الهيكل التنظيمي (رؤية، تكامل، مبيعات، تسويق، تسليم، مالية) — كل مقعد له مسؤول واحد. يُعدَّل من: النظام ← الرؤية." /></span>,
          <span key="c" className="inline-flex items-center gap-1">التكلفة/س
            <Hint text="كلفة الساعة الداخلية (SAR) — تدخل في حساب كلفة عمل المشاريع ومؤشر «عمل خارج الاتفاق». لا يراها إلا الشركاء." /></span>,
          <span key="w" className="inline-flex items-center gap-1">العبء
            <Hint text="عدد المهام المفتوحة المسندة إليه الآن، من كل المشاريع — فوق ٨ يظهر بالبرتقالي." /></span>,
          'الحالة']}>
          {(profiles ?? []).map((p) => {
            const isTeamRow = p.role !== 'client';
            const load = workload?.get(p.id) ?? 0;
            return (
              <Tr key={p.id}>
                <Td className="font-medium">{p.full_name || '—'}</Td>
                <Td dir="ltr" className="text-gray-light">{p.email}</Td>
                <Td>
                  {isAdmin && p.id !== me.id && isTeamRow ? (
                    <Select
                      value={p.role}
                      aria-label={`دور ${p.email}`}
                      onChange={(e) =>
                        changeRole.mutate({ id: p.id, newRole: e.target.value as Enums<'user_role'> })
                      }
                      className="w-36"
                    >
                      <option value="admin">شريك</option>
                      <option value="cfo">مدير مالي</option>
                      <option value="accountant">محاسب</option>
                      <option value="legal">مستشار قانوني</option>
                      <option value="auditor">مدقق حوكمة</option>
                      <option value="strategist">مدير عمليات</option>
                      <option value="executor">عضو تنفيذ</option>
                    </Select>
                  ) : (
                    <Badge variant={p.role === 'admin' ? 'accent' : 'neutral'}>
                      {ROLE_LABELS[p.role]}
                    </Badge>
                  )}
                </Td>
                <Td>
                  {isAdmin && isTeamRow ? (
                    <Input defaultValue={p.job_title ?? ''} aria-label={`مسمى ${p.email}`}
                      placeholder="—" className="w-32 py-1 text-xs"
                      onBlur={(e) =>
                        e.target.value !== (p.job_title ?? '') &&
                        updateHr.mutate({ id: p.id, patch: { job_title: e.target.value || null } })} />
                  ) : (
                    <span className="text-gray-light">{p.job_title ?? '—'}</span>
                  )}
                </Td>
                <Td>
                  {isAdmin && isTeamRow ? (
                    <Input type="number" dir="ltr" defaultValue={p.cost_rate_hourly ?? ''}
                      aria-label={`تكلفة ${p.email}`} placeholder="SAR"
                      className="w-20 py-1 text-xs"
                      onBlur={(e) =>
                        Number(e.target.value) !== Number(p.cost_rate_hourly ?? 0) &&
                        updateHr.mutate({
                          id: p.id,
                          patch: { cost_rate_hourly: Number(e.target.value) || null },
                        })} />
                  ) : (
                    <span dir="ltr" className="text-gray-light">
                      {p.cost_rate_hourly ? `${p.cost_rate_hourly}` : '—'}
                    </span>
                  )}
                </Td>
                <Td>
                  {isTeamRow ? (
                    <span className="flex flex-wrap gap-1">
                      {(seats ?? []).filter((s) => s.holder === p.id).map((s) => (
                        <Badge key={s.id} variant="outline">{s.name_ar}</Badge>
                      ))}
                      {(seats ?? []).every((s) => s.holder !== p.id) && (
                        <span className="text-xs text-gray-medium">بلا مقعد</span>
                      )}
                    </span>
                  ) : '—'}
                </Td>
                <Td>
                  {isTeamRow ? (
                    <Badge variant={load > 8 ? 'accent' : 'neutral'}
                      title="مهام مفتوحة مكلّف بها">
                      {load}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td>
                  <Badge variant={p.active ? 'accent' : 'neutral'}>
                    {p.active ? 'نشط' : 'موقوف'}
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}
      <PeopleAnalyzer
        team={(profiles ?? []).filter((p) => p.role !== 'client' && p.active)}
        isAdmin={isAdmin} meId={me.id} />
    </div>
  );
}

/** «ماذا يستطيع كل مستوى؟» — الصلاحيات كما تفرضها قاعدة البيانات فعلاً. */
function RoleMatrixCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5">
      <Button variant="ghost" size="xs" onClick={() => setOpen((v) => !v)}>
        {open ? 'إخفاء صلاحيات المستويات' : 'ماذا يستطيع كل مستوى صلاحية؟'}
      </Button>
      {open && (
        <div className="mt-2 overflow-x-auto">
          <Table head={['القدرة', ...MATRIX_ROLES.map((r) => ROLE_LABELS[r])]}>
            {ROLE_MATRIX.map((r) => (
              <Tr key={r.cap}>
                <Td className="text-gray-light">{r.cap}</Td>
                {MATRIX_ROLES.map((role) => (
                  <Td key={role}>
                    <span className={r.roles[role] ? 'font-bold text-pulse-orange' : 'text-gray-medium'}>
                      {r.roles[role] ? '✓' : '—'}
                    </span>
                  </Td>
                ))}
              </Tr>
            ))}
          </Table>
          <p className="mt-1 text-xs text-gray-medium">
            هذه حدود يفرضها النظام على مستوى قاعدة البيانات، لا مجرد إخفاء أزرار.
          </p>
        </div>
      )}
    </div>
  );
}

const SCORE_CYCLE: Record<string, string> = { '': '+', '+': '±', '±': '-', '-': '+' };
const quarterNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
};

/**
 * محلّل الأشخاص (EOS): كل شخص — الشريكان قبل غيرهما — يُقيَّم ربعياً على كل
 * قيمة جوهرية (+/±/−) وعلى GWC لمقعده. القاعدة: +++ أو لا يبقى في المقعد.
 */
function PeopleAnalyzer({ team, isAdmin, meId }: {
  team: Tables<'profiles'>[];
  isAdmin: boolean;
  meId: string;
}) {
  const quarter = quarterNow();
  const paKey = ['people-reviews', quarter];
  const { data } = useQuery({
    queryKey: paKey,
    queryFn: async () => {
      const supabase = getSupabase();
      const [reviews, vision] = await Promise.all([
        supabase.from('people_reviews').select('*').eq('quarter', quarter),
        supabase.from('vision').select('core_values').single(),
      ]);
      return {
        reviews: reviews.data ?? [],
        values: ((vision.data?.core_values as string[]) ?? []),
      };
    },
  });

  const save = useAppMutation(
    async ({ subject, value_scores, gwc }: {
      subject: string;
      value_scores: Record<string, string>;
      gwc: Record<string, boolean>;
    }) => {
      const { error } = await getSupabase().from('people_reviews').upsert({
        subject, reviewer: meId, quarter,
        value_scores: value_scores as never,
        gwc: gwc as never,
      }, { onConflict: 'subject,reviewer,quarter' });
      if (error) throw new Error(error.message);
    },
    { invalidate: [paKey], successMessage: 'حُفظ التقييم' }
  );

  if (!data || data.values.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-1 font-bold text-gray-light">محلّل الأشخاص — {quarter}</h2>
      <p className="mb-2 text-xs text-gray-medium">
        انقر الرمز نفسه ليتبدّل بين (+ ممتاز / ± متذبذب / − ضعيف). الأعمدة الثلاثة الأخيرة: يفهم دوره · يريده فعلاً · قادر عليه.
        القاعدة: من لا يحقق «+ + +» على القيم يُناقش مقعده في الجلسة الربعية —
        الشريكان يقيّم أحدهما الآخر أولاً.
      </p>
      <Table head={['العضو', ...data.values.map((v) => v.replace('(قرار شركاء) ', '')), 'يفهم دوره', 'يريده', 'قادر عليه']}>
        {team.map((p) => {
          const r = data.reviews.find((x) => x.subject === p.id && x.reviewer === meId);
          const scores = (r?.value_scores as Record<string, string>) ?? {};
          const gwc = (r?.gwc as Record<string, boolean>) ?? {};
          const disabled = !isAdmin;
          return (
            <Tr key={p.id}>
              <Td className="font-medium">{p.full_name ?? p.email}</Td>
              {data.values.map((v) => (
                <Td key={v}>
                  <button type="button" disabled={disabled}
                    aria-label={`تقييم ${p.full_name ?? ''} على ${v}`}
                    className="rounded-sm px-2 py-0.5 text-sm font-bold text-gray-light hover:bg-gray-dark/40 disabled:cursor-default focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
                    onClick={() => save.mutate({
                      subject: p.id,
                      value_scores: { ...scores, [v]: SCORE_CYCLE[scores[v] ?? ''] },
                      gwc,
                    })}>
                    <span className={scores[v] === '+' ? 'text-pulse-orange' : scores[v] === '-' ? 'text-gray-medium' : ''}>
                      {scores[v] ?? '·'}
                    </span>
                  </button>
                </Td>
              ))}
              {(['gets', 'wants', 'capacity'] as const).map((k) => (
                <Td key={k}>
                  <button type="button" disabled={disabled}
                    aria-label={`${k} — ${p.full_name ?? ''}`}
                    className="rounded-sm px-2 py-0.5 text-sm font-bold hover:bg-gray-dark/40 disabled:cursor-default focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none"
                    onClick={() => save.mutate({
                      subject: p.id, value_scores: scores,
                      gwc: { ...gwc, [k]: !gwc[k] },
                    })}>
                    <span className={gwc[k] ? 'text-pulse-orange' : 'text-gray-medium'}>
                      {gwc[k] ? '✓' : '·'}
                    </span>
                  </button>
                </Td>
              ))}
            </Tr>
          );
        })}
      </Table>
    </section>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, Hint, Input, Select, SkeletonList, Table, Td, Tr, useToast } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { PenLine } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation } from '../lib/queries';
import { fmtNum } from '../lib/format';
import { readImageAsDataUri } from '../lib/images';
import { CareersSection } from './PublicLayerAdmin';

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
  sales: 'مدير مبيعات',
  pm: 'مدير مشاريع',
  collections: 'مسؤول تحصيل',
  hr: 'شؤون الفريق',
  dpo: 'مسؤول الخصوصية',
  strategist: 'مدير عمليات',
  executor: 'عضو تنفيذ',
  client: 'عميل',
};

/** قدرات كل دور كما تفرضها قاعدة البيانات — تُعرض بطاقةً لكل دور. */
const ROLE_CAPS: { role: Exclude<Enums<'user_role'>, 'client'>; can: string[]; cannot: string[] }[] = [
  { role: 'admin',
    can: ['كل شيء بلا استثناء — بما فيه الفريق والأدوار والإعدادات كاملة'], cannot: [] },
  { role: 'cfo',
    can: ['كل التشغيل', 'الحسابات البنكية ونسب التوزيع', 'تأكيد جولات التوزيع وتوزيع الأرباح', 'اعتماد المستندات المالية'],
    cannot: ['إدارة الفريق والأدوار'] },
  { role: 'accountant',
    can: ['اعتماد وترقيم الفواتير', 'تسجيل الدفعات والمصروفات والاشتراكات', 'كل التشغيل'],
    cannot: ['الحسابات البنكية', 'نسب التوزيع وتأكيد الجولات'] },
  { role: 'legal',
    can: ['كل التشغيل', 'مكتبة البنود القانونية وقوالب العقود', 'اعتماد المستندات القانونية'],
    cannot: ['المالية الحساسة', 'الفريق'] },
  { role: 'auditor',
    can: ['قراءة كل السجلات بما فيها سجل التدقيق', 'اعتماد المستندات عند طلبه'],
    cannot: ['أي كتابة أو تعديل — دور رقابي صرف'] },
  { role: 'sales',
    can: ['المسار والعملاء والعروض والعقود', 'ترقيم عروض الأسعار والعقود', 'المشاريع'],
    cannot: ['اعتماد أو ترقيم الفواتير (يطلبها ولا يعتمدها)', 'تسجيل دفعات أو مصروفات'] },
  { role: 'pm',
    can: ['المشاريع والمهام والفحوصات كاملة', 'العملاء والمستندات تشغيلياً'],
    cannot: ['اعتماد الفواتير والدفعات والمصروفات'] },
  { role: 'collections',
    can: ['قراءة الفواتير والعملاء', 'تسجيل الدفعات ووعود السداد', 'تسجيل التواصل'],
    cannot: ['اعتماد الفواتير', 'المصروفات', 'الشطب (قرار شريك)'] },
  { role: 'hr',
    can: ['بيانات الفريق: المسمى، التكلفة/س، الإجازات'],
    cannot: ['تغيير الأدوار أو التفعيل (حارس على مستوى الصف)', 'أي بيانات مالية أو عملاء'] },
  { role: 'dpo',
    can: ['قراءة بيانات الأشخاص (عملاء، جهات اتصال، محتملون)', 'قراءة سجل التدقيق', 'اعتماد مستندات الخصوصية'],
    cannot: ['أي كتابة'] },
  { role: 'strategist',
    can: ['كل التشغيل بما فيه اعتماد الفواتير'],
    cannot: ['المالية الحساسة', 'الإعدادات', 'الفريق'] },
  { role: 'executor',
    can: ['مهامه: تنفيذ وتعليق ووقت وملفات وفحوصات'],
    cannot: ['ما عدا ذلك'] },
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

      <MySignatureCard me={me} />

      {(isAdmin || me.role === 'hr') && <CareersSection />}

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
            <option value="sales">مدير مبيعات</option>
            <option value="pm">مدير مشاريع</option>
            <option value="collections">مسؤول تحصيل</option>
            <option value="hr">شؤون الفريق</option>
            <option value="dpo">مسؤول الخصوصية</option>
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
                      <option value="sales">مدير مبيعات</option>
                      <option value="pm">مدير مشاريع</option>
                      <option value="collections">مسؤول تحصيل</option>
                      <option value="hr">شؤون الفريق</option>
                      <option value="dpo">مسؤول الخصوصية</option>
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
                  {isAdmin && isTeamRow && p.id !== me.id ? (
                    <button type="button"
                      title={p.active ? 'إيقاف العضو — يبدأ إجراء المغادرة تلقائياً' : 'إعادة تفعيل'}
                      onClick={() => updateHr.mutate({ id: p.id, patch: { active: !p.active } })}
                      className="focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">
                      <Badge variant={p.active ? 'accent' : 'neutral'}>
                        {p.active ? 'نشط' : 'موقوف'}
                      </Badge>
                    </button>
                  ) : (
                    <Badge variant={p.active ? 'accent' : 'neutral'}>
                      {p.active ? 'نشط' : 'موقوف'}
                    </Badge>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      )}
      {isAdmin && <StaffLifecycle team={(profiles ?? []).filter((p) => p.role !== 'client')} />}
      <CollaboratorsSection me={me} />
      <PeopleAnalyzer
        team={(profiles ?? []).filter((p) => p.role !== 'client' && p.active)}
        isAdmin={isAdmin} meId={me.id} />
    </div>
  );
}

/** دورة حياة الموظف (docs/05 B10): قوائم التعيين والمغادرة + سجل العهد.
 *  القوائم ينشئها النظام تلقائياً عند التفعيل/الإيقاف — هنا المتابعة والإقفال. */
type ChecklistItem = {
  key: string; label: string; due_days?: number;
  done?: boolean; done_by?: string; done_at?: string;
};

function StaffLifecycle({ team }: { team: Tables<'profiles'>[] }) {
  const key = ['staff_lifecycle'];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [cls, eq] = await Promise.all([
        s.from('staff_checklists').select('*').order('status').order('created_at', { ascending: false }),
        s.from('equipment_log').select('*').order('created_at', { ascending: false }),
      ]);
      return { checklists: cls.data ?? [], equipment: eq.data ?? [] };
    },
  });

  const toggleItem = useAppMutation(
    async ({ cl, itemKey }: { cl: Tables<'staff_checklists'>; itemKey: string }) => {
      const s = getSupabase();
      const { data: u } = await s.auth.getUser();
      const items = (cl.items as ChecklistItem[]).map((it) =>
        it.key === itemKey
          ? (it.done
            ? { ...it, done: false, done_by: undefined, done_at: undefined }
            : { ...it, done: true, done_by: u.user?.id, done_at: new Date().toISOString() })
          : it);
      const allDone = items.every((it) => it.done);
      const { error } = await s.from('staff_checklists')
        .update({ items: items as never, status: allDone ? 'done' : 'open' })
        .eq('id', cl.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );

  const [eqFor, setEqFor] = useState('');
  const [eqItem, setEqItem] = useState('');
  const addEquipment = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('equipment_log')
        .insert({ profile_id: eqFor, item: eqItem.trim() });
      if (error) throw new Error(error.message);
      setEqItem('');
    },
    { invalidate: [key], successMessage: 'سُجلت العهدة' }
  );
  const returnEquipment = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('equipment_log')
        .update({ returned_at: new Date().toISOString().slice(0, 10) }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'أُقفلت العهدة' }
  );

  const memberName = (id: string) => {
    const p = team.find((t) => t.id === id);
    return p?.full_name || p?.email || '—';
  };

  if (!data) return null;
  const open = data.checklists.filter((c) => c.status === 'open');
  const closed = data.checklists.filter((c) => c.status === 'done');

  return (
    <section className="mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
        تعيين ومغادرة
        <Hint wide text="ينشئ النظام قائمة تجهيز تلقائياً عند تفعيل عضو جديد (مع ترحيب بريدي بخطة أسبوعه الأول وجلسات متابعة ٣٠/٦٠/٩٠)، وقائمة مغادرة عند إيقافه. هنا تتابعها وتقفل بنودها، وتسجل العهد." />
      </h2>
      {open.length === 0 && (
        <p className="mb-3 text-sm text-gray-medium">لا قوائم مفتوحة — كل التعيينات والمغادرات مكتملة.</p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        {open.map((cl) => {
          const items = cl.items as ChecklistItem[];
          const done = items.filter((i) => i.done).length;
          return (
            <div key={cl.id} className="rounded-sm border border-gray-dark p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold">
                {memberName(cl.profile_id)}
                <Badge variant={cl.kind === 'onboarding' ? 'accent' : 'outline'}>
                  {cl.kind === 'onboarding' ? 'تعيين' : 'مغادرة'}
                </Badge>
                <span className="ms-auto text-xs font-normal text-gray-medium" dir="ltr">
                  {done}/{items.length}
                </span>
              </p>
              <ul className="space-y-1.5">
                {items.map((it) => (
                  <li key={it.key}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-light">
                      <input type="checkbox" checked={!!it.done}
                        onChange={() => toggleItem.mutate({ cl, itemKey: it.key })}
                        className="mt-1 accent-[#E8542F]" />
                      <span className={it.done ? 'line-through opacity-60' : ''}>
                        {it.label}
                        {it.due_days ? (
                          <span className="ms-1 text-xs text-gray-medium">
                            (يوم {it.due_days})
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {closed.length > 0 && (
        <p className="mt-2 text-xs text-gray-medium">
          مكتملة: {closed.map((c) => `${memberName(c.profile_id)} (${c.kind === 'onboarding' ? 'تعيين' : 'مغادرة'})`).join(' · ')}
        </p>
      )}

      <div className="mt-5 rounded-sm border border-gray-dark p-3">
        <p className="mb-2 text-sm font-bold">سجل العهد</p>
        <form className="mb-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); if (eqFor && eqItem.trim()) addEquipment.mutate(undefined as never); }}>
          <Select label="العضو" value={eqFor} onChange={(e) => setEqFor(e.target.value)} className="w-44">
            <option value="">اختر…</option>
            {team.filter((t) => t.active).map((t) => (
              <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
            ))}
          </Select>
          <Input label="العهدة" value={eqItem} onChange={(e) => setEqItem(e.target.value)}
            placeholder="مثال: MacBook Pro — SN…" className="w-64" />
          <Button type="submit" size="sm" variant="outline" loading={addEquipment.isPending}
            disabled={!eqFor || !eqItem.trim()}>
            تسجيل
          </Button>
        </form>
        {data.equipment.length === 0 ? (
          <p className="text-xs text-gray-medium">لا عهد مسجلة.</p>
        ) : (
          <Table head={['العضو', 'العهدة', 'التسليم', 'الحالة']}>
            {data.equipment.map((eq) => (
              <Tr key={eq.id}>
                <Td className="font-medium">{memberName(eq.profile_id)}</Td>
                <Td className="text-gray-light">{eq.item}</Td>
                <Td dir="ltr" className="text-gray-medium">{eq.given_at}</Td>
                <Td>
                  {eq.returned_at ? (
                    <Badge variant="neutral">أُعيدت {eq.returned_at}</Badge>
                  ) : (
                    <Button size="xs" variant="ghost" loading={returnEquipment.isPending}
                      onClick={() => returnEquipment.mutate(eq.id as never)}>
                      إقفال (أُعيدت)
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>
    </section>
  );
}

/** «ماذا يستطيع كل مستوى؟» — الصلاحيات كما تفرضها قاعدة البيانات فعلاً. */
/** توقيعي الشخصي — يظهر في خانة الطرف الأول بالعقود التي أنشئها. */
function MySignatureCard({ me }: { me: Tables<'profiles'> }) {
  const save = useAppMutation(
    async (file: File | null) => {
      const data = file ? await readImageAsDataUri(file) : null;
      // null = إزالة التوقيع؛ توليد الأنواع لا يعلّم معامل الدالة nullable
      const { error } = await getSupabase().rpc('set_my_signature',
        { p_data: data as unknown as string });
      if (error) throw new Error(error.message);
    },
    { invalidate: [['profiles']], successMessage: 'حُفظ توقيعك — سيظهر في العقود الجديدة التي تنشئها' }
  );
  if (me.role === 'client') return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-sm border border-gray-dark p-3">
      <PenLine className="h-4 w-4 text-pulse-orange" aria-hidden />
      <span className="text-sm font-bold">توقيعي</span>
      <Hint text="يُضمَّن في خانة توقيع الطرف الأول بكل عقد تنشئه من «المستندات». صورة PNG بخلفية شفافة، بحد ٥٠٠ كيلوبايت. تغييره لا يمس عقوداً محفوظة." />
      {me.signature_data ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={me.signature_data} alt="توقيعي" className="h-12 w-auto rounded-sm bg-white p-1" />
          <Button variant="ghost" size="xs" loading={save.isPending}
            onClick={() => save.mutate(null as never)}>
            إزالة
          </Button>
        </>
      ) : (
        <input type="file" accept="image/*" aria-label="رفع توقيعي"
          className="text-xs text-gray-light file:me-2 file:rounded-sm file:border file:border-gray-dark file:bg-transparent file:px-2 file:py-1 file:text-xs file:text-gray-light"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) save.mutate(f as never);
            e.target.value = '';
          }} />
      )}
    </div>
  );
}

function RoleMatrixCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-5">
      <Button variant="ghost" size="xs" onClick={() => setOpen((v) => !v)}>
        {open ? 'إخفاء صلاحيات المستويات' : 'ماذا يستطيع كل مستوى صلاحية؟'}
      </Button>
      {open && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_CAPS.map((r) => (
            <div key={r.role} className="rounded-sm border border-gray-dark p-3 text-xs">
              <p className="mb-1 font-bold text-pulse-orange">{ROLE_LABELS[r.role]}</p>
              {r.can.map((c, i) => <p key={i} className="text-gray-light">✓ {c}</p>)}
              {r.cannot.map((c, i) => <p key={i} className="text-gray-medium">— {c}</p>)}
            </div>
          ))}
          <p className="text-xs text-gray-medium sm:col-span-2 lg:col-span-3">
            هذه حدود تفرضها قاعدة البيانات نفسها، لا مجرد إخفاء أزرار. أمين
            الخزينة والضريبة يغطيهما المدير المالي والمحاسب؛ دفتر الأستاذ
            الرسمي عند محاسبكم الخارجي؛ وأمن النظام عند الشريك.
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

/* --------------------------------------------------------- collaborators */
/** المنفذون والمتعاونون (L 2026-08-09): مستقلون بلا حسابات دخول — سجل كامل
 *  بالتخصص والأسعار وNDA، وإسنادات لا تُدفع إلا بتقييم جودة (يفرضه المحفز). */
const COLLAB_STATUS_AR: Record<string, { label: string; variant: 'accent' | 'neutral' | 'outline' }> = {
  active: { label: 'نشط', variant: 'accent' },
  paused: { label: 'متوقف', variant: 'neutral' },
  blacklisted: { label: 'محظور', variant: 'outline' },
};
const ASG_STATUS_AR: Record<string, string> = {
  assigned: 'مُسند', delivered: 'مُسلّم', paid: 'مدفوع', cancelled: 'ملغي',
};
const RATE_AR: Record<string, string> = {
  hourly: 'بالساعة', per_project: 'بالمشروع', monthly: 'شهري',
};

function CollaboratorsSection({ me }: { me: Tables<'profiles'> }) {
  const key = ['collaborators'];
  const canManage = ['admin', 'strategist', 'pm', 'hr'].includes(me.role);
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [collabs, asgs, rates] = await Promise.all([
        s.from('collaborators').select('*').order('status').order('full_name'),
        s.from('collaborator_assignments').select('*').order('created_at', { ascending: false }),
        s.from('fx_rates').select('code'),
      ]);
      return { collabs: collabs.data ?? [], asgs: asgs.data ?? [], codes: (rates.data ?? []).map((r) => r.code) };
    },
  });

  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [nName, setNName] = useState(''); const [nSpec, setNSpec] = useState('تصميم');
  const [nPhone, setNPhone] = useState(''); const [nRate, setNRate] = useState('');
  const [nRateType, setNRateType] = useState('per_project'); const [nCur, setNCur] = useState('SAR');

  const addCollab = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('collaborators').insert({
        full_name: nName.trim(), specialty: nSpec, phone: nPhone.trim() || null,
        rate: Number(nRate) || null, rate_type: nRateType, currency: nCur, created_by: me.id,
      });
      if (error) throw new Error(error.message);
      setNName(''); setNPhone(''); setNRate(''); setShowNew(false);
    },
    { invalidate: [key], successMessage: 'أُضيف المتعاون' }
  );
  const patchCollab = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('collaborators').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const patchAsg = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('collaborator_assignments').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const [asgTitle, setAsgTitle] = useState(''); const [asgAmount, setAsgAmount] = useState('');
  const [asgCur, setAsgCur] = useState('SAR');
  const addAsg = useAppMutation(
    async (collabId: string) => {
      const { error } = await getSupabase().from('collaborator_assignments').insert({
        collaborator_id: collabId, title: asgTitle.trim(),
        agreed_amount: Number(asgAmount), currency: asgCur, created_by: me.id,
      });
      if (error) throw new Error(error.message);
      setAsgTitle(''); setAsgAmount('');
    },
    { invalidate: [key], successMessage: 'أُسند العمل' }
  );

  if (!data) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-1 flex items-center gap-2 text-base font-bold">
        المنفذون والمتعاونون
        <Hint wide text="المستقلون وشركاء الإنتاج (مطورون، مصممون، مصورون، مونتيرية…) بلا حسابات دخول — منفصلون عن أعضاء النظام. الدفع يتطلب تقييم جودة إلزامياً ويتسجل مصروفاً بالمكافئ الريالي تلقائياً. لا تُسند عملاً يمس بيانات عميل لمن لم يوقع NDA." />
        {canManage && (
          <Button size="xs" variant="outline" className="ms-auto" onClick={() => setShowNew(!showNew)}>
            {showNew ? 'إغلاق' : '+ متعاون'}
          </Button>
        )}
      </h2>

      {showNew && canManage && (
        <form className="mb-3 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3"
          onSubmit={(e) => { e.preventDefault(); if (nName.trim()) addCollab.mutate(undefined as never); }}>
          <Input label="الاسم" value={nName} onChange={(e) => setNName(e.target.value)} className="w-44" />
          <Select label="التخصص" value={nSpec} onChange={(e) => setNSpec(e.target.value)} className="w-36">
            {['تصميم', 'تطوير', 'تصوير', 'مونتاج', 'موشن جرافيك', 'كتابة', 'تسويق أداء', 'صوت', 'أخرى'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Input label="الجوال" dir="ltr" value={nPhone} onChange={(e) => setNPhone(e.target.value)} className="w-36" />
          <Select label="التسعير" value={nRateType} onChange={(e) => setNRateType(e.target.value)} className="w-28">
            {Object.entries(RATE_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="السعر" type="number" dir="ltr" value={nRate} onChange={(e) => setNRate(e.target.value)} className="w-24" />
          <Select label="العملة" value={nCur} onChange={(e) => setNCur(e.target.value)} className="w-24">
            {data.codes.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Button type="submit" size="sm" loading={addCollab.isPending} disabled={!nName.trim()}>حفظ</Button>
        </form>
      )}

      {data.collabs.length === 0 ? (
        <p className="text-sm text-gray-medium">لا متعاونين بعد — سجّل شبكة منفذيك هنا.</p>
      ) : (
        <div className="space-y-2">
          {data.collabs.map((c) => {
            const st = COLLAB_STATUS_AR[c.status] ?? COLLAB_STATUS_AR.active;
            const asgs = data.asgs.filter((a) => a.collaborator_id === c.id);
            return (
              <Card key={c.id} className="p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{c.full_name}</b>
                  <Badge variant="outline">{c.specialty}</Badge>
                  <Badge variant={st.variant}>{st.label}</Badge>
                  {c.rating && <span title="متوسط جودة التسليمات">{'★'.repeat(c.rating)}</span>}
                  {c.rate && (
                    <span dir="ltr" className="text-xs text-gray-medium">
                      {fmtNum(Number(c.rate))} {c.currency} / {RATE_AR[c.rate_type]}
                    </span>
                  )}
                  <Badge variant={c.nda_signed_on ? 'neutral' : 'accent'}>
                    {c.nda_signed_on ? 'NDA ✓' : 'بلا NDA'}
                  </Badge>
                  <span className="ms-auto flex gap-1.5">
                    {canManage && !c.nda_signed_on && (
                      <Button variant="ghost" size="xs"
                        onClick={() => patchCollab.mutate({ id: c.id, p: { nda_signed_on: new Date().toISOString().slice(0, 10) } })}>
                        وقّع NDA
                      </Button>
                    )}
                    <Button variant="ghost" size="xs" onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                      {openId === c.id ? 'إغلاق' : `الإسنادات (${asgs.length})`}
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="xs"
                        onClick={() => patchCollab.mutate({ id: c.id, p: { status: c.status === 'active' ? 'paused' : 'active' } })}>
                        {c.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </Button>
                    )}
                  </span>
                </div>
                {openId === c.id && (
                  <div className="mt-3 space-y-2 border-t border-gray-dark pt-3">
                    {canManage && c.status === 'active' && (
                      <form className="flex flex-wrap items-end gap-2"
                        onSubmit={(e) => { e.preventDefault(); if (asgTitle.trim() && Number(asgAmount) > 0) addAsg.mutate(c.id as never); }}>
                        <Input label="العمل المسند" value={asgTitle} onChange={(e) => setAsgTitle(e.target.value)} className="w-56" />
                        <Input label="المبلغ المتفق" type="number" dir="ltr" value={asgAmount}
                          onChange={(e) => setAsgAmount(e.target.value)} className="w-28" />
                        <Select label="العملة" value={asgCur} onChange={(e) => setAsgCur(e.target.value)} className="w-24">
                          {data.codes.map((cd) => <option key={cd} value={cd}>{cd}</option>)}
                        </Select>
                        <Button type="submit" size="sm" variant="outline" loading={addAsg.isPending}
                          disabled={!asgTitle.trim() || !(Number(asgAmount) > 0)}>
                          إسناد
                        </Button>
                      </form>
                    )}
                    {asgs.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-medium">{a.title}</span>
                        <span dir="ltr" className="text-gray-medium">{fmtNum(Number(a.agreed_amount))} {a.currency}</span>
                        <Badge variant={a.status === 'paid' ? 'neutral' : 'outline'}>{ASG_STATUS_AR[a.status]}</Badge>
                        {a.quality_rating && <span>{'★'.repeat(a.quality_rating)}</span>}
                        {canManage && a.status === 'assigned' && (
                          <Button variant="ghost" size="xs"
                            onClick={() => patchAsg.mutate({ id: a.id, p: { status: 'delivered' } })}>
                            تسلمناه
                          </Button>
                        )}
                        {canManage && a.status === 'delivered' && (
                          <span className="flex items-center gap-1">
                            <Select aria-label="تقييم الجودة" defaultValue=""
                              onChange={(e) => {
                                const r = Number(e.target.value);
                                if (r) patchAsg.mutate({ id: a.id, p: { status: 'paid', quality_rating: r } });
                              }} className="w-40 py-1 text-xs">
                              <option value="" disabled>قيّم وادفع…</option>
                              {[5, 4, 3, 2, 1].map((r) => (
                                <option key={r} value={r}>{'★'.repeat(r)} — {r === 5 ? 'ممتاز' : r === 4 ? 'جيد جداً' : r === 3 ? 'جيد' : r === 2 ? 'مقبول' : 'ضعيف'}</option>
                              ))}
                            </Select>
                          </span>
                        )}
                      </div>
                    ))}
                    {asgs.length === 0 && <p className="text-xs text-gray-medium">لا إسنادات بعد.</p>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

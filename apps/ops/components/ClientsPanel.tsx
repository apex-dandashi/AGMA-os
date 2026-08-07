'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Select,
  SkeletonList,
  useToast,
} from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import {
  clientInputSchema,
  contactInputSchema,
  interactionInputSchema,
} from '@agma/db/schemas';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useCatalog, useClientDetail, useClients } from '../lib/queries';
import { Download, Pencil, Trash2, Users } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import { fmtDate, fmtSAR } from '../lib/format';
import ScopeBuilder from './ScopeBuilder';
import QuoteBuilder from './QuoteBuilder';

type Client = Tables<'clients'>;
type Scope = Tables<'scopes'>;

const KIND_LABELS: Record<Enums<'interaction_kind'>, string> = {
  call: 'مكالمة',
  whatsapp: 'واتساب',
  email: 'بريد',
  meeting: 'اجتماع',
  note: 'ملاحظة',
};

const SCOPE_STATUS: Record<Enums<'scope_status'>, string> = {
  draft: 'مسودة',
  sent: 'بانتظار الاعتماد',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export default function ClientsPanel() {
  const { data: clients, isLoading } = useClients();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');
  const selected = clients?.find((c) => c.id === selectedId) ?? null;
  const [newCompany, setNewCompany] = useState('');
  const [newError, setNewError] = useState<string | undefined>();
  const [query, setQuery] = useState('');

  const addClient = useAppMutation(
    async (company: string) => {
      const { data, error } = await getSupabase()
        .from('clients')
        .insert({ company })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    { invalidate: [keys.clients], successMessage: 'أُضيف العميل' }
  );

  async function submitNew(e: FormEvent) {
    e.preventDefault();
    const parsed = clientInputSchema.safeParse({ company: newCompany });
    if (!parsed.success) {
      setNewError(parsed.error.issues[0]?.message);
      return;
    }
    setNewError(undefined);
    const client = (await addClient.mutateAsync(parsed.data.company)) as Client;
    setNewCompany('');
    router.replace(`/clients/?id=${client.id}`);
  }

  const visible = (clients ?? []).filter((c) =>
    query.trim() ? c.company.includes(query.trim()) : true
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div>
        <h1 className="mb-3 text-xl font-black">العملاء</h1>
        <form onSubmit={submitNew} className="mb-2 flex gap-2">
          <Input
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="شركة جديدة…"
            error={newError}
          />
          <Button type="submit" size="sm" loading={addClient.isPending}>+</Button>
        </form>
        <div className="mb-2 flex items-center gap-1.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث…"
            className="flex-1"
          />
          <Button variant="ghost" size="xs" aria-label="تصدير CSV"
            disabled={visible.length === 0}
            onClick={() => exportCsv('clients',
              ['الشركة', 'القطاع', 'الحالة', 'الوسوم', 'أنشئ في'],
              visible.map((c) => [c.company, c.sector, c.status,
                (c.tags ?? []).join(' | '), c.created_at.slice(0, 10)]))}>
            <Download className="h-3.5 w-3.5" aria-hidden /> CSV
          </Button>
        </div>
        {isLoading ? (
          <SkeletonList rows={6} />
        ) : (
          <div className="space-y-1" role="listbox" aria-label="قائمة العملاء">
            {visible.map((c) => (
              <button
                key={c.id}
                role="option"
                aria-selected={selectedId === c.id}
                onClick={() => router.replace(`/clients/?id=${c.id}`)}
                className={`block w-full rounded-sm px-3 py-2 text-start text-sm focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                  selectedId === c.id
                    ? 'bg-pulse-orange/15 text-pulse-orange'
                    : 'text-gray-light hover:bg-gray-dark/40'
                }`}
              >
                {c.company}
              </button>
            ))}
            {visible.length === 0 && (
              <p className="px-2 py-4 text-sm text-gray-medium">
                {query ? 'لا نتائج' : 'لا يوجد عملاء بعد'}
              </p>
            )}
          </div>
        )}
      </div>
      {selected ? (
        <ClientDetail key={selected.id} client={selected} />
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8" aria-hidden />}
          title="اختر عميلاً"
          hint="اختر عميلاً من القائمة لعرض جهات الاتصال وسجل التواصل والنطاقات، أو أنشئ عميلاً جديداً."
        />
      )}
    </div>
  );
}

function Client360Card({ clientId }: { clientId: string }) {
  const { data: c360 } = useQuery({
    queryKey: ['client-360', clientId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('client_360').select('*').eq('id', clientId).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  if (!c360) return null;
  const stat = (label: string, value: string, alert = false) => (
    <div className="text-center">
      <p dir="ltr" className={`text-sm font-black ${alert ? 'text-pulse-orange' : ''}`}>{value}</p>
      <p className="text-[11px] text-gray-medium">{label}</p>
    </div>
  );
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-3" aria-label="ملخص العميل 360">
      {stat('المفوتر', fmtSAR(c360.invoiced_total))}
      {stat('المحصَّل', fmtSAR(c360.paid_total))}
      {stat('الرصيد المستحق', fmtSAR(c360.open_balance), Number(c360.open_balance) > 0)}
      {stat('مشاريع نشطة', String(c360.active_projects ?? 0))}
      {stat('اعتمادات معلّقة', String(c360.pending_approvals ?? 0), Number(c360.pending_approvals) > 0)}
      {stat('آخر تواصل', fmtDate(c360.last_interaction_at))}
      {c360.bought_package && <Badge variant="accent">عميل باقات</Badge>}
    </Card>
  );
}

const CLIENT_STATUS: Record<Enums<'client_status'>, string> = {
  active: 'نشط', paused: 'متوقف مؤقتاً', archived: 'مؤرشف',
};

/** بيانات العميل — every field the record supports, editable in place. */
function ClientProfileCard({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    sector: client.sector ?? '',
    decision_maker: client.decision_maker ?? '',
    budget_tier: client.budget_tier ?? '',
    website: client.website ?? '',
    city: client.city ?? '',
    cr_number: client.cr_number ?? '',
    vat_number: client.vat_number ?? '',
    tags: (client.tags ?? []).join('، '),
    status: client.status,
  });

  const save = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('clients').update({
        sector: form.sector.trim() || null,
        decision_maker: form.decision_maker.trim() || null,
        budget_tier: form.budget_tier.trim() || null,
        website: form.website.trim() || null,
        city: form.city.trim() || null,
        cr_number: form.cr_number.trim() || null,
        vat_number: form.vat_number.trim() || null,
        tags: form.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
        status: form.status,
      }).eq('id', client.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clients], successMessage: 'حُفظت بيانات العميل' }
  );

  if (!editing) {
    const fact = (label: string, v: string | null, ltr = false) =>
      v ? (
        <span className="text-xs text-gray-light">
          <span className="text-gray-medium">{label}: </span>
          <span dir={ltr ? 'ltr' : undefined}>{v}</span>
        </span>
      ) : null;
    return (
      <Card className="flex flex-wrap items-center gap-x-4 gap-y-1.5 p-3">
        <Badge variant={client.status === 'active' ? 'accent' : 'outline'}>
          {CLIENT_STATUS[client.status] ?? client.status}
        </Badge>
        {fact('القطاع', client.sector)}
        {fact('صاحب القرار', client.decision_maker)}
        {fact('المدينة', client.city)}
        {client.website && (
          <a href={/^https?:\/\//.test(client.website) ? client.website : `https://${client.website}`}
            target="_blank" rel="noreferrer" dir="ltr"
            className="text-xs text-pulse-orange underline-offset-2 hover:underline">
            {client.website}
          </a>
        )}
        {fact('س.ت', client.cr_number, true)}
        {fact('الرقم الضريبي', client.vat_number, true)}
        {(client.tags ?? []).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
        <Button variant="ghost" size="xs" className="ms-auto" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden /> تعديل البيانات
        </Button>
      </Card>
    );
  }

  const field = (label: string, key: keyof typeof form, ltr = false, mode?: 'url' | 'numeric') => (
    <Input label={label} value={form[key] as string} dir={ltr ? 'ltr' : undefined}
      inputMode={mode} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
  );
  return (
    <Card className="p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field('القطاع', 'sector')}
        {field('صاحب القرار', 'decision_maker')}
        {field('فئة الميزانية', 'budget_tier')}
        {field('الموقع الإلكتروني', 'website', true, 'url')}
        {field('المدينة', 'city')}
        {field('السجل التجاري', 'cr_number', true, 'numeric')}
        {field('الرقم الضريبي (VAT)', 'vat_number', true, 'numeric')}
        {field('الوسوم (مفصولة بفواصل)', 'tags')}
        <Select label="الحالة" value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Client['status'] }))}>
          {Object.entries(CLIENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" loading={save.isPending}
          onClick={async () => {
            await save.mutateAsync(undefined as never);
            setEditing(false);
          }}>
          حفظ
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>إلغاء</Button>
      </div>
    </Card>
  );
}

function ClientDetail({ client }: { client: Client }) {
  const { data, isLoading } = useClientDetail(client.id);
  const { data: catalog } = useCatalog();
  const [showScopeBuilder, setShowScopeBuilder] = useState(false);
  const [quoteScope, setQuoteScope] = useState<Scope | null>(null);
  const toast = useToast();

  const sendScope = useAppMutation(
    async (scope: Scope) => {
      const supabase = getSupabase();
      const { error } = await supabase.from('scopes').update({ status: 'sent' }).eq('id', scope.id);
      if (error) throw new Error(error.message);
      const { error: e2 } = await supabase.from('approvals').insert({
        client_id: client.id,
        item_type: 'scope',
        item_id: scope.id,
      });
      if (e2) throw new Error(e2.message);
    },
    {
      invalidate: [keys.clientDetail(client.id)],
      successMessage: 'أُرسل النطاق للاعتماد',
    }
  );

  if (isLoading || !data) return <SkeletonList rows={6} />;
  const { contacts, interactions, scopes } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black">{client.company}</h2>
      <Client360Card clientId={client.id} />
      <ClientProfileCard key={`profile-${client.id}`} client={client} />

      <section>
        <div className="mb-2 flex items-center gap-3">
          <h3 className="font-bold text-gray-light">النطاقات (Scopes)</h3>
          <Button variant="outline" size="xs" onClick={() => setShowScopeBuilder((v) => !v)}>
            {showScopeBuilder ? 'إغلاق' : '+ نطاق جديد'}
          </Button>
        </div>
        {showScopeBuilder && (
          <ScopeBuilder clientId={client.id} onDone={() => setShowScopeBuilder(false)} />
        )}
        <div className="space-y-2">
          {scopes.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3 text-sm">
              <Badge variant={s.status === 'approved' ? 'accent' : 'neutral'}>
                {SCOPE_STATUS[s.status]}
              </Badge>
              <span className="text-gray-light">{s.service_ids.length} خدمة</span>
              {s.timeline && <span className="text-gray-medium">{s.timeline}</span>}
              <span className="ms-auto flex gap-1.5">
                <Button variant="ghost" size="xs"
                  onClick={() => setQuoteScope(quoteScope?.id === s.id ? null : s)}>
                  {quoteScope?.id === s.id ? 'إغلاق' : 'عرض سعر من النطاق'}
                </Button>
                {s.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="xs"
                    loading={sendScope.isPending}
                    onClick={() => sendScope.mutate(s)}
                  >
                    إرسال للاعتماد
                  </Button>
                )}
              </span>
            </Card>
          ))}
          {scopes.length === 0 && !showScopeBuilder && (
            <p className="text-sm text-gray-medium">لا نطاقات بعد</p>
          )}
        </div>
        {quoteScope && (
          <div className="mt-3">
            <QuoteBuilder
              clients={[client]}
              onDone={() => setQuoteScope(null)}
              initial={{
                clientId: client.id,
                scopeId: quoteScope.id,
                items: (catalog?.services ?? [])
                  .filter((sv) => quoteScope.service_ids.includes(sv.id))
                  .map((sv) => ({ title: sv.name_ar, description: '', amount: 0 })),
              }}
            />
          </div>
        )}
      </section>

      <ClientDocumentsSection clientId={client.id} />

      <section className="grid gap-6 md:grid-cols-2">
        <ContactsBlock clientId={client.id} contacts={contacts} isFirst={contacts.length === 0} />
        <InteractionsBlock clientId={client.id} interactions={interactions} />
      </section>
    </div>
  );
}

function ContactsBlock({
  clientId,
  contacts,
  isFirst,
}: {
  clientId: string;
  contacts: Tables<'contacts'>[];
  isFirst: boolean;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | undefined>();

  const add = useAppMutation(
    async (input: { name: string; phone?: string; email?: string }) => {
      const { error } = await getSupabase().from('contacts').insert({
        client_id: clientId,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        is_primary: isFirst,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)], successMessage: 'أُضيفت جهة الاتصال' }
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = contactInputSchema.safeParse({ name, phone, email });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message);
      return;
    }
    setErr(undefined);
    await add.mutateAsync({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
    });
    setName('');
    setPhone('');
    setEmail('');
  }

  return (
    <div>
      <h3 className="mb-2 font-bold text-gray-light">جهات الاتصال</h3>
      <form onSubmit={submit} className="mb-2 flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" error={err} />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="الهاتف"
          dir="ltr" inputMode="tel" className="w-36" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد"
          dir="ltr" inputMode="email" className="w-44" />
        <Button type="submit" size="sm" loading={add.isPending}>+</Button>
      </form>
      <ul className="space-y-1 text-sm">
        {contacts.map((c) => (
          <ContactRow key={c.id} contact={c} clientId={clientId} />
        ))}
        {contacts.length === 0 && <li className="text-sm text-gray-medium">لا جهات اتصال</li>}
      </ul>
    </div>
  );
}

function ContactRow({ contact: c, clientId }: { contact: Tables<'contacts'>; clientId: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({ name: c.name, phone: c.phone ?? '', email: c.email ?? '' });
  const [err, setErr] = useState<string | undefined>();

  const patch = useAppMutation(
    async (p: Record<string, unknown>) => {
      const supabase = getSupabase();
      if (p.is_primary === true) {
        await supabase.from('contacts').update({ is_primary: false }).eq('client_id', clientId);
      }
      const { error } = await supabase.from('contacts').update(p as never).eq('id', c.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)] }
  );
  const remove = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('contacts').delete().eq('id', c.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)], successMessage: 'حُذفت جهة الاتصال (مسجّل في التدقيق)' }
  );

  if (editing) {
    return (
      <li className="space-y-1.5 rounded-sm border border-gray-dark p-2">
        <div className="flex flex-wrap gap-1.5">
          <Input value={form.name} aria-label="الاسم" className="w-32"
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input value={form.phone} aria-label="الهاتف" dir="ltr" inputMode="tel" className="w-32"
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input value={form.email} aria-label="البريد" dir="ltr" inputMode="email" className="w-40"
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        {err && <p className="text-xs text-pulse-orange">{err}</p>}
        <div className="flex gap-1.5">
          <Button size="xs" loading={patch.isPending} onClick={async () => {
            const parsed = contactInputSchema.safeParse(form);
            if (!parsed.success) { setErr(parsed.error.issues[0]?.message); return; }
            await patch.mutateAsync({
              name: parsed.data.name,
              phone: parsed.data.phone ?? null,
              email: parsed.data.email ?? null,
            });
            setEditing(false);
          }}>حفظ</Button>
          <Button variant="ghost" size="xs" onClick={() => setEditing(false)}>إلغاء</Button>
        </div>
      </li>
    );
  }
  return (
    <li className="group flex items-center gap-2 text-gray-light">
      <span>{c.name}</span>
      {c.is_primary && <Badge variant="accent">رئيسي</Badge>}
      {c.phone && <span dir="ltr" className="text-gray-medium">{c.phone}</span>}
      {c.email && <span dir="ltr" className="text-gray-medium">{c.email}</span>}
      <span className="ms-auto flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        {!c.is_primary && (
          <Button variant="ghost" size="xs" onClick={() => patch.mutate({ is_primary: true })}>
            تعيين رئيسياً
          </Button>
        )}
        <Button variant="ghost" size="xs" aria-label={`تعديل ${c.name}`}
          onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
        <Button variant="ghost" size="xs" aria-label={`حذف ${c.name}`}
          onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3 w-3" aria-hidden />
        </Button>
      </span>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)}
        title="حذف جهة الاتصال"
        message={`حذف «${c.name}»؟ الإجراء يُسجَّل في سجل التدقيق.`}
        confirmLabel="حذف"
        onConfirm={async () => { await remove.mutateAsync(undefined as never); }} />
    </li>
  );
}

function InteractionsBlock({
  clientId,
  interactions,
}: {
  clientId: string;
  interactions: Tables<'interactions'>[];
}) {
  const [kind, setKind] = useState<Enums<'interaction_kind'>>('call');
  const [summary, setSummary] = useState('');
  const [err, setErr] = useState<string | undefined>();

  const add = useAppMutation(
    async (input: { kind: Enums<'interaction_kind'>; summary: string }) => {
      const { error } = await getSupabase().from('interactions').insert({
        client_id: clientId,
        kind: input.kind,
        summary: input.summary,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)], successMessage: 'سُجّل التواصل' }
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = interactionInputSchema.safeParse({ kind, summary });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message);
      return;
    }
    setErr(undefined);
    await add.mutateAsync(parsed.data);
    setSummary('');
  }

  return (
    <div>
      <h3 className="mb-2 font-bold text-gray-light">سجل التواصل</h3>
      <form onSubmit={submit} className="mb-2 flex gap-2">
        <Select value={kind} onChange={(e) => setKind(e.target.value as Enums<'interaction_kind'>)} className="w-28">
          {(Object.keys(KIND_LABELS) as Enums<'interaction_kind'>[]).map((k) => (
            <option key={k} value={k}>{KIND_LABELS[k]}</option>
          ))}
        </Select>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="ملخص…" error={err} />
        <Button type="submit" size="sm" loading={add.isPending}>+</Button>
      </form>
      <ul className="space-y-1 text-sm">
        {interactions.map((i) => (
          <InteractionRow key={i.id} interaction={i} clientId={clientId} />
        ))}
        {interactions.length === 0 && <li className="text-sm text-gray-medium">لا سجلات بعد</li>}
      </ul>
    </div>
  );
}

function InteractionRow({ interaction: i, clientId }:
  { interaction: Tables<'interactions'>; clientId: string }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [summary, setSummary] = useState(i.summary);

  const patch = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('interactions')
        .update({ summary: summary.trim() }).eq('id', i.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)] }
  );
  const remove = useAppMutation(
    async () => {
      const { error } = await getSupabase().from('interactions').delete().eq('id', i.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.clientDetail(clientId)], successMessage: 'حُذف السجل (موثّق في التدقيق)' }
  );

  if (editing) {
    return (
      <li className="flex gap-1.5">
        <Input value={summary} aria-label="تعديل الملخص" className="flex-1"
          onChange={(e) => setSummary(e.target.value)} />
        <Button size="xs" loading={patch.isPending} disabled={summary.trim().length < 3}
          onClick={async () => { await patch.mutateAsync(undefined as never); setEditing(false); }}>
          حفظ
        </Button>
        <Button variant="ghost" size="xs" onClick={() => { setEditing(false); setSummary(i.summary); }}>
          إلغاء
        </Button>
      </li>
    );
  }
  return (
    <li className="group flex items-center gap-2 text-gray-light">
      <span className="min-w-0 flex-1">
        <span className="text-xs text-gray-medium">{KIND_LABELS[i.kind]}</span> — {i.summary}
      </span>
      <span className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <Button variant="ghost" size="xs" aria-label="تعديل السجل" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" aria-hidden />
        </Button>
        <Button variant="ghost" size="xs" aria-label="حذف السجل" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3 w-3" aria-hidden />
        </Button>
      </span>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)}
        title="حذف سجل التواصل"
        message="حذف هذا السجل؟ الإجراء يُسجَّل في سجل التدقيق."
        confirmLabel="حذف"
        onConfirm={async () => { await remove.mutateAsync(undefined as never); }} />
    </li>
  );
}

const DOC_TYPE_AR: Record<string, string> = {
  quote: 'عرض سعر', sow: 'نطاق عمل', nda: 'عدم إفصاح', sla: 'مستوى خدمة',
  msa: 'اتفاقية رئيسية', amc: 'عقد صيانة', coc: 'ميثاق تعاون',
  invoice: 'فاتورة', credit_note: 'إشعار دائن',
};

/** كل مستندات العميل في مكانه — الإدارة تبقى في «المستندات» و«المالية». */
function ClientDocumentsSection({ clientId }: { clientId: string }) {
  const { data: docs } = useQuery({
    queryKey: ['client-docs', clientId],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('documents')
        .select('id, type, number, status, total, issued_on, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  if (!docs?.length) return null;
  return (
    <section>
      <h3 className="mb-2 font-bold text-gray-light">المستندات والفواتير</h3>
      <div className="space-y-1.5">
        {docs.map((d) => (
          <Card key={d.id} className="flex flex-wrap items-center gap-3 p-2.5 text-sm">
            <Badge variant="outline">{DOC_TYPE_AR[d.type] ?? d.type}</Badge>
            <b dir="ltr">{d.number ?? 'مسودة'}</b>
            <span className="text-xs text-gray-medium">{d.status}</span>
            {d.total != null && <span dir="ltr" className="text-gray-light">{fmtSAR(d.total)}</span>}
            <span dir="ltr" className="ms-auto text-xs text-gray-medium">{fmtDate(d.issued_on ?? d.created_at)}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}

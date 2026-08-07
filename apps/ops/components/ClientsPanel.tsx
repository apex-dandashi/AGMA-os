'use client';

import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
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
import { keys, useAppMutation, useClientDetail, useClients } from '../lib/queries';
import { Download, Users } from 'lucide-react';
import { exportCsv } from '../lib/csv';
import { fmtDate, fmtSAR } from '../lib/format';
import ScopeBuilder from './ScopeBuilder';

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

function ClientDetail({ client }: { client: Client }) {
  const { data, isLoading } = useClientDetail(client.id);
  const [showScopeBuilder, setShowScopeBuilder] = useState(false);
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
              {s.status === 'draft' && (
                <Button
                  variant="outline"
                  size="xs"
                  className="ms-auto"
                  loading={sendScope.isPending}
                  onClick={() => sendScope.mutate(s)}
                >
                  إرسال للاعتماد
                </Button>
              )}
            </Card>
          ))}
          {scopes.length === 0 && !showScopeBuilder && (
            <p className="text-sm text-gray-medium">لا نطاقات بعد</p>
          )}
        </div>
      </section>

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
          <li key={c.id} className="flex gap-2 text-gray-light">
            <span>{c.name}</span>
            {c.is_primary && <Badge variant="accent">رئيسي</Badge>}
            {c.phone && <span dir="ltr" className="text-gray-medium">{c.phone}</span>}
            {c.email && <span dir="ltr" className="text-gray-medium">{c.email}</span>}
          </li>
        ))}
        {contacts.length === 0 && <li className="text-sm text-gray-medium">لا جهات اتصال</li>}
      </ul>
    </div>
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
          <li key={i.id} className="text-gray-light">
            <span className="text-xs text-gray-medium">{KIND_LABELS[i.kind]}</span> — {i.summary}
          </li>
        ))}
        {interactions.length === 0 && <li className="text-sm text-gray-medium">لا سجلات بعد</li>}
      </ul>
    </div>
  );
}

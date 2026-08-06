'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Card } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import ScopeBuilder from './ScopeBuilder';

type Client = Tables<'clients'>;
type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [newCompany, setNewCompany] = useState('');

  const load = useCallback(async () => {
    const { data } = await getSupabase().from('clients').select('*').order('company');
    setClients(data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addClient(e: FormEvent) {
    e.preventDefault();
    if (!newCompany.trim()) return;
    await getSupabase().from('clients').insert({ company: newCompany.trim() });
    setNewCompany('');
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div>
        <h1 className="mb-3 text-xl font-black">العملاء</h1>
        <form onSubmit={addClient} className="mb-3 flex gap-2">
          <input
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            placeholder="شركة جديدة…"
            className="flex-1 rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm"
          />
          <Button type="submit" className="px-3 py-1.5 text-sm">+</Button>
        </form>
        <div className="space-y-1">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`block w-full rounded-sm px-3 py-2 text-start text-sm ${
                selected?.id === c.id
                  ? 'bg-pulse-orange/15 text-pulse-orange'
                  : 'text-gray-light hover:bg-gray-dark/40'
              }`}
            >
              {c.company}
            </button>
          ))}
          {clients.length === 0 && (
            <p className="text-sm text-gray-medium">لا يوجد عملاء بعد</p>
          )}
        </div>
      </div>
      {selected ? (
        <ClientDetail key={selected.id} client={selected} />
      ) : (
        <p className="pt-12 text-center text-gray-medium">اختر عميلاً من القائمة</p>
      )}
    </div>
  );
}

function ClientDetail({ client }: { client: Client }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [showScopeBuilder, setShowScopeBuilder] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const [c, i, s] = await Promise.all([
      supabase.from('contacts').select('*').eq('client_id', client.id).order('created_at'),
      supabase.from('interactions').select('*').eq('client_id', client.id)
        .order('occurred_at', { ascending: false }).limit(20),
      supabase.from('scopes').select('*').eq('client_id', client.id)
        .order('created_at', { ascending: false }),
    ]);
    setContacts(c.data ?? []);
    setInteractions(i.data ?? []);
    setScopes(s.data ?? []);
  }, [client.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendScope(scope: Scope) {
    const supabase = getSupabase();
    await supabase.from('scopes').update({ status: 'sent' }).eq('id', scope.id);
    await supabase.from('approvals').insert({
      client_id: client.id,
      item_type: 'scope',
      item_id: scope.id,
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-black">{client.company}</h2>

      <section>
        <div className="mb-2 flex items-center gap-3">
          <h3 className="font-bold text-gray-light">النطاقات (Scopes)</h3>
          <Button variant="outline" className="px-3 py-1 text-xs"
            onClick={() => setShowScopeBuilder((v) => !v)}>
            {showScopeBuilder ? 'إغلاق' : '+ نطاق جديد'}
          </Button>
        </div>
        {showScopeBuilder && (
          <ScopeBuilder clientId={client.id} onDone={() => { setShowScopeBuilder(false); load(); }} />
        )}
        <div className="space-y-2">
          {scopes.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                s.status === 'approved' ? 'bg-pulse-orange/20 text-pulse-orange' : 'bg-gray-dark text-gray-light'
              }`}>
                {SCOPE_STATUS[s.status]}
              </span>
              <span className="text-gray-light">{s.service_ids.length} خدمة</span>
              {s.timeline && <span className="text-gray-medium">{s.timeline}</span>}
              {s.status === 'draft' && (
                <Button variant="outline" className="ms-auto px-3 py-1 text-xs" onClick={() => sendScope(s)}>
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
        <ContactsBlock clientId={client.id} contacts={contacts} onChange={load} />
        <InteractionsBlock clientId={client.id} interactions={interactions} onChange={load} />
      </section>
    </div>
  );
}

function ContactsBlock({ clientId, contacts, onChange }:
  { clientId: string; contacts: Contact[]; onChange: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await getSupabase().from('contacts').insert({
      client_id: clientId,
      name: name.trim(),
      phone: phone || null,
      is_primary: contacts.length === 0,
    });
    setName('');
    setPhone('');
    onChange();
  }

  return (
    <div>
      <h3 className="mb-2 font-bold text-gray-light">جهات الاتصال</h3>
      <form onSubmit={add} className="mb-2 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم"
          className="flex-1 rounded-sm border border-gray-dark bg-transparent px-2 py-1 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="الهاتف" dir="ltr"
          className="w-32 rounded-sm border border-gray-dark bg-transparent px-2 py-1 text-sm" />
        <Button type="submit" className="px-3 py-1 text-sm">+</Button>
      </form>
      <ul className="space-y-1 text-sm">
        {contacts.map((c) => (
          <li key={c.id} className="flex gap-2 text-gray-light">
            <span>{c.name}</span>
            {c.is_primary && <span className="text-xs text-pulse-orange">رئيسي</span>}
            {c.phone && <span dir="ltr" className="text-gray-medium">{c.phone}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InteractionsBlock({ clientId, interactions, onChange }:
  { clientId: string; interactions: Interaction[]; onChange: () => void }) {
  const [kind, setKind] = useState<Enums<'interaction_kind'>>('call');
  const [summary, setSummary] = useState('');

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    await getSupabase().from('interactions').insert({
      client_id: clientId,
      kind,
      summary: summary.trim(),
    });
    setSummary('');
    onChange();
  }

  return (
    <div>
      <h3 className="mb-2 font-bold text-gray-light">سجل التواصل</h3>
      <form onSubmit={add} className="mb-2 flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as Enums<'interaction_kind'>)}
          className="rounded-sm border border-gray-dark bg-pure-ink px-2 py-1 text-sm">
          {(Object.keys(KIND_LABELS) as Enums<'interaction_kind'>[]).map((k) => (
            <option key={k} value={k}>{KIND_LABELS[k]}</option>
          ))}
        </select>
        <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="ملخص…"
          className="flex-1 rounded-sm border border-gray-dark bg-transparent px-2 py-1 text-sm" />
        <Button type="submit" className="px-3 py-1 text-sm">+</Button>
      </form>
      <ul className="space-y-1 text-sm">
        {interactions.map((i) => (
          <li key={i.id} className="text-gray-light">
            <span className="text-xs text-gray-medium">{KIND_LABELS[i.kind]}</span> — {i.summary}
          </li>
        ))}
      </ul>
    </div>
  );
}

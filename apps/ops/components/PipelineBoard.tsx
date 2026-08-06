'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button, Card } from '@agma/ui';
import { LEAD_STAGES, type Enums, type Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

type Lead = Tables<'leads'>;
type Stage = Enums<'lead_stage'>;

const STAGE_LABELS: Record<Stage, string> = {
  discovery_call: 'مكالمة استكشافية',
  opportunity_analysis: 'تحليل الفرص',
  scoping: 'تحديد النطاق',
  roadmap: 'خارطة الطريق',
  live: 'مباشر',
  optimize: 'تحسين',
};

const SOURCE_LABELS: Record<Enums<'lead_source'>, string> = {
  call: 'مكالمة',
  whatsapp: 'واتساب',
  email: 'بريد',
  site: 'الموقع',
};

export default function PipelineBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError('تعذر تحميل المسار — تأكد من صلاحياتك');
    setLeads(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveStage(lead: Lead, stage: Stage) {
    await getSupabase().from('leads').update({ stage }).eq('id', lead.id);
    load();
  }

  async function convertToClient(lead: Lead) {
    const supabase = getSupabase();
    const { data: client, error } = await supabase
      .from('clients')
      .insert({ company: lead.company || lead.name })
      .select()
      .single();
    if (error || !client) return;
    await supabase
      .from('leads')
      .update({ client_id: client.id, stage: 'live' })
      .eq('id', lead.id);
    load();
  }

  if (loading) return <p className="text-gray-medium">…جاري التحميل</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <h1 className="text-xl font-black">مسار المبيعات</h1>
        <Button variant="outline" className="px-4 py-1.5 text-sm" onClick={() => setShowNew(true)}>
          + عميل محتمل
        </Button>
        {error && <span className="text-sm text-pulse-orange">{error}</span>}
      </div>

      {showNew && <NewLeadForm onDone={() => { setShowNew(false); load(); }} />}

      <div className="grid gap-3 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
        {LEAD_STAGES.map((stage) => (
          <div key={stage} className="min-w-44">
            <h2 className="mb-2 text-sm font-bold text-gray-light">
              {STAGE_LABELS[stage]}
              <span className="ms-2 text-gray-medium">
                {leads.filter((l) => l.stage === stage).length}
              </span>
            </h2>
            <div className="space-y-2">
              {leads
                .filter((l) => l.stage === stage)
                .map((lead) => (
                  <Card key={lead.id} className="p-3 text-sm">
                    <p className="font-bold">{lead.name}</p>
                    {lead.company && <p className="text-gray-light">{lead.company}</p>}
                    <p className="mt-1 text-xs text-gray-medium">
                      {SOURCE_LABELS[lead.source]}
                    </p>
                    {lead.notes && (
                      <p className="mt-1 whitespace-pre-line text-xs text-gray-medium line-clamp-4">
                        {lead.notes}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={lead.stage}
                        onChange={(e) => moveStage(lead, e.target.value as Stage)}
                        className="flex-1 rounded-sm border border-gray-dark bg-pure-ink px-1 py-1 text-xs"
                      >
                        {LEAD_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      {!lead.client_id && lead.stage === 'roadmap' && (
                        <button
                          onClick={() => convertToClient(lead)}
                          className="rounded-sm bg-pulse-orange px-2 py-1 text-xs font-bold"
                          title="تحويل إلى عميل"
                        >
                          ← عميل
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewLeadForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState<Enums<'lead_source'>>('call');
  const [notes, setNotes] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    await getSupabase().from('leads').insert({
      name,
      company: company || null,
      source,
      notes: notes || null,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-3">
      <label className="text-xs text-gray-medium">
        الاسم
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="mt-1 block rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm text-snow" />
      </label>
      <label className="text-xs text-gray-medium">
        الشركة
        <input value={company} onChange={(e) => setCompany(e.target.value)}
          className="mt-1 block rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm text-snow" />
      </label>
      <label className="text-xs text-gray-medium">
        المصدر
        <select value={source} onChange={(e) => setSource(e.target.value as Enums<'lead_source'>)}
          className="mt-1 block rounded-sm border border-gray-dark bg-pure-ink px-2 py-1.5 text-sm">
          {(Object.keys(SOURCE_LABELS) as Enums<'lead_source'>[]).map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
      </label>
      <label className="flex-1 text-xs text-gray-medium">
        ملاحظات
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm text-snow" />
      </label>
      <Button type="submit" className="px-4 py-1.5 text-sm">حفظ</Button>
    </form>
  );
}

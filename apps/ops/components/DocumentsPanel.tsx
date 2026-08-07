'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import {
  renderContract,
  renderQuote,
  type ContractPayload,
  type QuotePayload,
} from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';
import QuoteBuilder from './QuoteBuilder';

type Doc = Tables<'documents'>;
type Client = Tables<'clients'>;

const TYPE_LABELS: Record<Enums<'document_type'>, string> = {
  quote: 'عرض سعر',
  sow: 'نطاق عمل',
  nda: 'عدم إفصاح',
  sla: 'مستوى خدمة',
  msa: 'اتفاقية رئيسية',
  amc: 'عقد صيانة',
  coc: 'مدونة سلوك',
};

const STATUS_LABELS: Record<Enums<'document_status'>, string> = {
  draft: 'مسودة',
  sent: 'مُرسل',
  signed: 'موقَّع',
  active: 'نشط',
  expired: 'منتهي',
  void: 'ملغى',
};

export default function DocumentsPanel() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    const [d, c] = await Promise.all([
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('company'),
    ]);
    setDocs(d.data ?? []);
    setClients(c.data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openPrint(doc: Doc) {
    const html =
      doc.type === 'quote'
        ? renderQuote(doc.payload as unknown as QuotePayload)
        : renderContract(doc.payload as unknown as ContractPayload);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  async function finalizeQuote(doc: Doc) {
    setError(null);
    const supabase = getSupabase();
    const { data: number, error: rpcErr } = await supabase.rpc('next_document_number', {
      p_prefix: 'Q',
    });
    if (rpcErr || !number) {
      setError('تعذر حجز رقم المستند');
      return;
    }
    const payload = { ...(doc.payload as object), number } as never;
    const { error: upErr } = await supabase
      .from('documents')
      .update({
        number,
        status: 'sent',
        payload,
        issued_on: new Date().toISOString().slice(0, 10),
      })
      .eq('id', doc.id);
    if (upErr) setError('فشل الاعتماد — الرقم محجوز، راجع السجل');
    load();
  }

  async function setStatus(doc: Doc, status: Enums<'document_status'>) {
    await getSupabase().from('documents').update({ status }).eq('id', doc.id);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <h1 className="text-xl font-black">المستندات</h1>
        <Button variant="outline" className="px-4 py-1.5 text-sm" onClick={() => setShowBuilder((v) => !v)}>
          {showBuilder ? 'إغلاق' : '+ عرض سعر'}
        </Button>
        {error && <span className="text-sm text-pulse-orange">{error}</span>}
      </div>

      {showBuilder && (
        <QuoteBuilder clients={clients} onDone={() => { setShowBuilder(false); load(); }} />
      )}

      <div className="space-y-2">
        {docs.map((doc) => {
          const client = clients.find((c) => c.id === doc.client_id);
          return (
            <Card key={doc.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="rounded-full bg-gray-dark px-2 py-0.5 text-xs text-gray-light">
                {TYPE_LABELS[doc.type]}
              </span>
              <b dir="ltr">{doc.number ?? '—'}</b>
              <span className="text-gray-light">{client?.company}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  doc.status === 'draft'
                    ? 'bg-gray-dark text-gray-light'
                    : 'bg-pulse-orange/20 text-pulse-orange'
                }`}
              >
                {STATUS_LABELS[doc.status]}
              </span>
              <span className="ms-auto flex gap-2">
                <button onClick={() => openPrint(doc)} className="text-xs text-gray-light hover:text-snow">
                  معاينة / طباعة
                </button>
                {doc.type === 'quote' && doc.status === 'draft' && (
                  <Button className="px-3 py-1 text-xs" onClick={() => finalizeQuote(doc)}>
                    اعتماد وترقيم
                  </Button>
                )}
                {doc.status === 'sent' && (
                  <>
                    <button onClick={() => setStatus(doc, 'signed')} className="text-xs text-pulse-orange">
                      توقيع ✓
                    </button>
                    <button onClick={() => setStatus(doc, 'void')} className="text-xs text-gray-medium">
                      إلغاء
                    </button>
                  </>
                )}
                {doc.status === 'signed' && (
                  <button onClick={() => setStatus(doc, 'active')} className="text-xs text-pulse-orange">
                    تفعيل
                  </button>
                )}
              </span>
            </Card>
          );
        })}
        {docs.length === 0 && <p className="text-sm text-gray-medium">لا مستندات بعد</p>}
      </div>
    </div>
  );
}

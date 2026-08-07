'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Select,
  SkeletonList,
} from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import {
  renderContract,
  renderQuote,
  type ContractPayload,
  type QuotePayload,
} from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClients, useDocuments } from '../lib/queries';
import { FileText, PenLine } from 'lucide-react';
import QuoteBuilder from './QuoteBuilder';

type Doc = Tables<'documents'>;

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
  const { data: docs, isLoading } = useDocuments();
  const { data: clients } = useClients();
  const [showBuilder, setShowBuilder] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [finalizing, setFinalizing] = useState<Doc | null>(null);
  const [voiding, setVoiding] = useState<Doc | null>(null);

  const finalize = useAppMutation(
    async (doc: Doc) => {
      const supabase = getSupabase();
      const { data: number, error: rpcErr } = await supabase.rpc('next_document_number', {
        p_prefix: 'Q',
      });
      if (rpcErr || !number) throw new Error('تعذر حجز رقم المستند');
      const payload = { ...(doc.payload as object), number } as never;
      const { error } = await supabase
        .from('documents')
        .update({
          number,
          status: 'sent',
          payload,
          issued_on: new Date().toISOString().slice(0, 10),
        })
        .eq('id', doc.id);
      if (error) throw new Error('فشل الاعتماد — راجع سجل التدقيق');
      return number;
    },
    { invalidate: [keys.documents], successMessage: 'اعتُمد المستند ورُقّم' }
  );

  const setStatus = useAppMutation(
    async ({ doc, status }: { doc: Doc; status: Enums<'document_status'> }) => {
      const { error } = await getSupabase().from('documents').update({ status }).eq('id', doc.id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.documents] }
  );

  // Immutability-compatible correction path: duplicate as a new draft version.
  const newVersion = useAppMutation(
    async (doc: Doc) => {
      const payload = { ...(doc.payload as object), number: null } as never;
      const { error } = await getSupabase().from('documents').insert({
        type: doc.type,
        client_id: doc.client_id,
        scope_id: doc.scope_id,
        payload,
        payment_account_id: doc.payment_account_id,
        version: doc.version + 1,
        supersedes: doc.id,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.documents], successMessage: 'أُنشئت نسخة جديدة كمسودة' }
  );

  const visible = useMemo(
    () =>
      (docs ?? []).filter(
        (d) =>
          (statusFilter === 'all' || d.status === statusFilter) &&
          (typeFilter === 'all' || d.type === typeFilter)
      ),
    [docs, statusFilter, typeFilter]
  );

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-black">المستندات</h1>
        <Button variant="outline" size="sm" onClick={() => setShowBuilder((v) => !v)}>
          {showBuilder ? 'إغلاق' : '+ عرض سعر'}
        </Button>
        <div className="ms-auto flex gap-2">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="تصفية بالنوع">
            <option value="all">كل الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="تصفية بالحالة">
            <option value="all">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
      </div>

      {showBuilder && (
        <QuoteBuilder clients={clients ?? []} onDone={() => setShowBuilder(false)} />
      )}

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden />}
          title={docs?.length ? 'لا نتائج للتصفية الحالية' : 'لا مستندات بعد'}
          hint={docs?.length ? undefined : 'أنشئ أول عرض سعر — سيحمل الرقم Q-00055.'}
          action={
            !docs?.length ? (
              <Button size="sm" onClick={() => setShowBuilder(true)}>+ عرض سعر</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((doc) => {
            const client = (clients ?? []).find((c) => c.id === doc.client_id);
            return (
              <Card key={doc.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <Badge>{TYPE_LABELS[doc.type]}</Badge>
                <b dir="ltr">{doc.number ?? '—'}</b>
                {doc.version > 1 && <Badge variant="outline">v{doc.version}</Badge>}
                <span className="text-gray-light">{client?.company}</span>
                <Badge variant={doc.status === 'draft' ? 'neutral' : 'accent'}>
                  {STATUS_LABELS[doc.status]}
                </Badge>
                <span className="ms-auto flex items-center gap-2">
                  <Button variant="ghost" size="xs" onClick={() => openPrint(doc)}>
                    معاينة / طباعة
                  </Button>
                  {doc.type === 'quote' && doc.status === 'draft' && (
                    <Button size="xs" onClick={() => setFinalizing(doc)}>
                      اعتماد وترقيم
                    </Button>
                  )}
                  {doc.status === 'sent' && (
                    <>
                      <Button variant="outline" size="xs"
                        onClick={() => setStatus.mutate({ doc, status: 'signed' })}>
                        <PenLine className="h-3.5 w-3.5" aria-hidden /> توقيع
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setVoiding(doc)}>
                        إلغاء
                      </Button>
                    </>
                  )}
                  {doc.status === 'signed' && (
                    <Button variant="outline" size="xs"
                      onClick={() => setStatus.mutate({ doc, status: 'active' })}>
                      تفعيل
                    </Button>
                  )}
                  {doc.status !== 'draft' && (
                    <Button variant="ghost" size="xs" loading={newVersion.isPending}
                      onClick={() => newVersion.mutate(doc)}>
                      نسخة جديدة
                    </Button>
                  )}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!finalizing}
        onClose={() => setFinalizing(null)}
        title="اعتماد وترقيم المستند"
        message="سيُحجز الرقم التسلسلي التالي بشكل نهائي ولا يمكن التراجع — بعد الاعتماد يصبح المستند غير قابل للتعديل (التصحيح عبر نسخة جديدة فقط). متابعة؟"
        confirmLabel="اعتماد"
        onConfirm={async () => {
          if (finalizing) await finalize.mutateAsync(finalizing);
        }}
      />
      <ConfirmDialog
        open={!!voiding}
        onClose={() => setVoiding(null)}
        title="إلغاء المستند"
        danger
        message={`سيتحول «${voiding?.number ?? 'المستند'}» إلى حالة ملغى نهائياً. الرقم التسلسلي يبقى محجوزاً في السجل (بدون فجوات). متابعة؟`}
        confirmLabel="إلغاء المستند"
        onConfirm={async () => {
          if (voiding) await setStatus.mutateAsync({ doc: voiding, status: 'void' });
        }}
      />
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Select, Textarea } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { COMPANY, renderContract, type ContractPayload } from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClauses } from '../lib/queries';

type Client = Tables<'clients'>;

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const todayAr = () => {
  const d = new Date();
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** Contract types this builder produces; NDA ships with a full clause set. */
const CONTRACT_TYPES: { type: Enums<'document_type'>; title: string; clauseCategory: string }[] = [
  { type: 'nda', title: 'اتفاقية عدم إفصاح', clauseCategory: 'nda' },
  { type: 'sow', title: 'اتفاقية نطاق عمل', clauseCategory: 'legal' },
  { type: 'sla', title: 'اتفاقية مستوى الخدمة', clauseCategory: 'legal' },
  { type: 'msa', title: 'اتفاقية خدمات رئيسية', clauseCategory: 'legal' },
  { type: 'amc', title: 'عقد صيانة سنوي', clauseCategory: 'legal' },
  { type: 'coc', title: 'ميثاق التعاون', clauseCategory: 'legal' },
];

/**
 * Contract builder (docs/03): NDA in three clicks — pick client, clauses
 * arrive pre-approved from the library, preview, save draft. Finalization
 * (numbering + freeze) stays in the documents list like every document.
 */
export default function ContractBuilder({ clients, onDone }:
  { clients: Client[]; onDone: () => void }) {
  const { data: clauses } = useClauses();
  const [docType, setDocType] = useState<Enums<'document_type'>>('nda');
  const [clientId, setClientId] = useState('');
  const [secondPartyRep, setSecondPartyRep] = useState('');
  const [preamble, setPreamble] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [extraTitle, setExtraTitle] = useState('');
  const [extraBody, setExtraBody] = useState('');
  const [extras, setExtras] = useState<{ title: string; body: string }[]>([]);
  const [preview, setPreview] = useState(false);

  const meta = CONTRACT_TYPES.find((t) => t.type === docType)!;
  const client = clients.find((c) => c.id === clientId);
  const available = useMemo(
    () => (clauses ?? []).filter((c) => c.approved &&
      (c.category === meta.clauseCategory || (meta.clauseCategory !== 'nda' && c.category === 'commercial'))),
    [clauses, meta.clauseCategory]
  );
  // Default: NDA picks its whole set; other types start with legal clauses.
  const effective = picked ?? new Set(
    available.filter((c) => c.category === meta.clauseCategory).map((c) => c.id)
  );

  const payload = useMemo<ContractPayload | null>(() => {
    if (!client) return null;
    return {
      docTitleAr: meta.title,
      number: null,
      issueDateAr: todayAr(),
      city: COMPANY.city,
      firstParty: {
        name: COMPANY.legalNameAr,
        descriptor: `س.ت ${COMPANY.cr} — ${COMPANY.city}`,
      },
      secondParty: {
        name: client.company,
        descriptor: [
          client.cr_number && `س.ت ${client.cr_number}`,
          client.city,
          secondPartyRep && `يمثلها: ${secondPartyRep}`,
        ].filter(Boolean).join(' — ') || undefined,
      },
      preamble: preamble ||
        (docType === 'nda'
          ? 'حيث إن الطرفين بصدد تبادل معلومات ذات طبيعة سرية لغرض بحث أو تنفيذ تعاون تجاري بينهما، فقد اتفقا على ما يلي:'
          : undefined),
      clauses: [
        ...available.filter((c) => effective.has(c.id))
          .map((c) => ({ title: c.title_ar, body: c.body_ar })),
        ...extras,
      ],
    };
  }, [client, meta.title, docType, secondPartyRep, preamble, available, effective, extras]);

  const save = useAppMutation(
    async () => {
      if (!payload) throw new Error('اختر العميل أولاً');
      if (payload.clauses.length === 0) throw new Error('اختر بنداً واحداً على الأقل');
      const { error } = await getSupabase().from('documents').insert({
        type: docType,
        client_id: clientId,
        payload: payload as never,
        valid_until: expiresOn || null,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.documents], successMessage: 'حُفظ العقد كمسودة — اعتمده ليأخذ رقماً' }
  );

  return (
    <div className="mb-4 space-y-3 rounded-sm border border-gray-dark p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="نوع العقد" value={docType}
          onChange={(e) => {
            setDocType(e.target.value as Enums<'document_type'>);
            setPicked(null);
          }}>
          {CONTRACT_TYPES.map((t) => <option key={t.type} value={t.type}>{t.title}</option>)}
        </Select>
        <Select label="العميل (الطرف الثاني)" value={clientId}
          onChange={(e) => setClientId(e.target.value)}>
          <option value="">— اختر —</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </Select>
        <Input label="ممثل الطرف الثاني (اختياري)" value={secondPartyRep}
          onChange={(e) => setSecondPartyRep(e.target.value)} />
        <Input label="تاريخ انتهاء العقد (تنبيه تجديد قبل ٦٠ و٣٠ يوماً)"
          type="date" dir="ltr" value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)} />
      </div>
      {client && !client.cr_number && (
        <p className="text-xs text-gray-medium">
          تلميح: أضف السجل التجاري في بيانات العميل ليظهر في ديباجة العقد.
        </p>
      )}
      <Textarea label="الديباجة (اختياري — تُولَّد تلقائياً لعدم الإفصاح)" rows={2}
        value={preamble} onChange={(e) => setPreamble(e.target.value)} />

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="بنود العقد">
        {available.map((c) => (
          <button key={c.id} type="button" aria-pressed={effective.has(c.id)}
            onClick={() => {
              const next = new Set(effective);
              if (next.has(c.id)) next.delete(c.id);
              else next.add(c.id);
              setPicked(next);
            }}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
              effective.has(c.id)
                ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                : 'border-gray-dark text-gray-light'
            }`}>
            {c.title_ar}
          </button>
        ))}
      </div>

      <details className="rounded-sm border border-gray-dark p-3">
        <summary className="cursor-pointer text-xs text-gray-light">بند مخصص إضافي</summary>
        <div className="mt-2 space-y-2">
          <Input label="عنوان البند" value={extraTitle} onChange={(e) => setExtraTitle(e.target.value)} />
          <Textarea label="نص البند" rows={3} value={extraBody} onChange={(e) => setExtraBody(e.target.value)} />
          <Button variant="outline" size="xs"
            disabled={extraTitle.trim().length < 2 || extraBody.trim().length < 10}
            onClick={() => {
              setExtras((p) => [...p, { title: extraTitle.trim(), body: extraBody.trim() }]);
              setExtraTitle(''); setExtraBody('');
            }}>
            + أضف البند
          </Button>
          {extras.map((x, i) => (
            <p key={i} className="text-xs text-gray-medium">
              ✓ {x.title}{' '}
              <button type="button" className="text-pulse-orange"
                onClick={() => setExtras((p) => p.filter((_, j) => j !== i))}>حذف</button>
            </p>
          ))}
        </div>
      </details>

      <div className="flex gap-2">
        <Button size="sm" loading={save.isPending} disabled={!payload}
          onClick={async () => {
            await save.mutateAsync(undefined as never);
            onDone();
          }}>
          حفظ كمسودة
        </Button>
        <Button variant="outline" size="sm" disabled={!payload}
          onClick={() => setPreview((v) => !v)}>
          {preview ? 'إخفاء المعاينة' : 'معاينة'}
        </Button>
      </div>

      {preview && payload && (
        <iframe title={`معاينة ${meta.title}`} srcDoc={renderContract(payload)}
          className="h-[600px] w-full rounded-sm border border-gray-dark bg-white" />
      )}
    </div>
  );
}

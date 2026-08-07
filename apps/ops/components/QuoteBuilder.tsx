'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Input, Select, Textarea } from '@agma/ui';
import type { Tables } from '@agma/db';
import { quoteDraftSchema } from '@agma/db/schemas';
import {
  COMPANY,
  renderQuote,
  type QuoteItem,
  type QuotePayload,
} from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClauses, usePaymentAccounts } from '../lib/queries';

type Client = Tables<'clients'>;

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function todayAr(): string {
  const d = new Date();
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const emptyItem = (): QuoteItem => ({ title: '', description: '', amount: 0 });

export default function QuoteBuilder({ clients, onDone }:
  { clients: Client[]; onDone: () => void }) {
  const { data: accounts } = usePaymentAccounts();
  const { data: clauses } = useClauses();
  const [clientId, setClientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [intro, setIntro] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [discountLabel, setDiscountLabel] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [opt1, setOpt1] = useState({ label: 'الإجمالي · الخيار الأول', amount: 0 });
  const [opt2, setOpt2] = useState({ label: 'الإجمالي · الخيار الثاني', amount: 0, recommended: true });
  const [accountId, setAccountId] = useState('');
  const [pickedClauses, setPickedClauses] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    if (!accountId && accounts?.length) {
      setAccountId(accounts.find((a) => a.is_default)?.id ?? accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (clauses && pickedClauses.size === 0) {
      setPickedClauses(new Set(clauses.filter((c) => c.category === 'commercial').map((c) => c.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clauses]);

  const payload = useMemo<QuotePayload | null>(() => {
    const account = accounts?.find((a) => a.id === accountId);
    const client = clients.find((c) => c.id === clientId);
    if (!account || !client) return null;
    return {
      number: null,
      issueDateAr: todayAr(),
      city: COMPANY.city,
      recipientName: recipientName || client.company,
      recipientCompany: recipientName ? client.company : undefined,
      projectName: projectName || 'مشروع جديد',
      intro: intro || undefined,
      items: items.filter((i) => i.title && i.amount > 0),
      discounts:
        discountLabel && discountAmount > 0
          ? [{ label: discountLabel, amount: discountAmount }]
          : [],
      // Up to 2 priced scenarios with ★ marker (docs/06 §3.4)
      options: [
        ...(opt1.amount > 0 ? [{ label: opt1.label, amount: opt1.amount }] : []),
        ...(opt2.amount > 0 ? [{ label: opt2.label, amount: opt2.amount, recommended: true }] : []),
      ],
      vatEnabled: false,
      paymentAccount: {
        iban: account.iban,
        bankName: account.bank_name,
        beneficiaryName: account.beneficiary_name,
      },
      clauses: (clauses ?? [])
        .filter((c) => pickedClauses.has(c.id))
        .map((c) => ({ title: c.title_ar, body: c.body_ar })),
      totalPages: 2,
    };
  }, [accounts, accountId, clients, clientId, recipientName, projectName, intro, items, discountLabel, discountAmount, clauses, pickedClauses]);

  const save = useAppMutation(
    async () => {
      const parsed = quoteDraftSchema.safeParse({
        clientId,
        recipientName,
        projectName: projectName || 'مشروع جديد',
        intro,
        items: items.filter((i) => i.title || i.amount > 0),
        discountLabel: discountLabel || undefined,
        discountAmount: discountAmount || undefined,
        accountId,
      });
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? 'بيانات غير صالحة';
        setErr(msg);
        throw new Error(msg);
      }
      setErr(undefined);
      const { error } = await getSupabase().from('documents').insert({
        type: 'quote',
        client_id: clientId,
        payload: payload as never,
        payment_account_id: accountId,
      });
      if (error) throw new Error(error.message);
    },
    { invalidate: [keys.documents], successMessage: 'حُفظت المسودة' }
  );

  function setItem(i: number, patch: Partial<QuoteItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function moveItem(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="mb-4 space-y-3 rounded-sm border border-gray-dark p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="العميل" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">— اختر —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </Select>
        <Input label="اسم المستلم" value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)} placeholder="السيد / …" />
        <Input label="اسم المشروع" value={projectName}
          onChange={(e) => setProjectName(e.target.value)} />
        <Select label="حساب التحويل" value={accountId} dir="ltr"
          onChange={(e) => setAccountId(e.target.value)}>
          {(accounts ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.iban.slice(0, 4)}…{a.iban.slice(-4)} — {a.bank_name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea label="مقدمة العرض" value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} />

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <span className="pb-2 text-xs text-gray-medium">{String(i + 1).padStart(2, '0')}</span>
            <Input label={i === 0 ? 'الخدمة' : undefined} value={item.title}
              onChange={(e) => setItem(i, { title: e.target.value })} className="w-44" />
            <div className="min-w-40 flex-1">
              <Input label={i === 0 ? 'الوصف' : undefined} value={item.description ?? ''}
                onChange={(e) => setItem(i, { description: e.target.value })}
                placeholder="· بين الميزات" />
            </div>
            <Input label={i === 0 ? 'SAR' : undefined} type="number" dir="ltr" className="w-24"
              value={item.amount || ''} onChange={(e) => setItem(i, { amount: Number(e.target.value) })} />
            <Input label={i === 0 ? 'قبل الخصم' : undefined} type="number" dir="ltr" className="w-24"
              value={item.originalAmount || ''}
              onChange={(e) => setItem(i, { originalAmount: Number(e.target.value) || undefined })} />
            <div className="pb-2">
              <Checkbox label="بدون خصم" checked={!!item.noDiscount}
                onChange={(e) => setItem(i, { noDiscount: e.target.checked })} />
            </div>
            <div className="flex gap-1 pb-1.5">
              <button type="button" aria-label="تحريك لأعلى" disabled={i === 0}
                onClick={() => moveItem(i, -1)}
                className="rounded-sm px-1.5 text-gray-medium hover:text-snow disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">↑</button>
              <button type="button" aria-label="تحريك لأسفل" disabled={i === items.length - 1}
                onClick={() => moveItem(i, 1)}
                className="rounded-sm px-1.5 text-gray-medium hover:text-snow disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">↓</button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-end gap-2">
          <Button variant="outline" size="xs" onClick={() => setItems((p) => [...p, emptyItem()])}>
            + بند
          </Button>
          <Input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)}
            placeholder="اسم الخصم (اختياري)" className="w-44" />
          <Input type="number" dir="ltr" value={discountAmount || ''}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            placeholder="قيمة الخصم" className="w-28" />
        </div>
        <fieldset className="rounded-sm border border-gray-dark p-3">
          <legend className="px-1 text-xs text-gray-light">سيناريوهات التسعير (اختياري — حتى خيارين)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex gap-2">
              <Input value={opt1.label} onChange={(e) => setOpt1({ ...opt1, label: e.target.value })}
                aria-label="اسم الخيار الأول" />
              <Input type="number" dir="ltr" value={opt1.amount || ''} className="w-28"
                aria-label="قيمة الخيار الأول"
                onChange={(e) => setOpt1({ ...opt1, amount: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2">
              <Input value={opt2.label} onChange={(e) => setOpt2({ ...opt2, label: e.target.value })}
                aria-label="اسم الخيار الثاني (المُوصى به ★)" />
              <Input type="number" dir="ltr" value={opt2.amount || ''} className="w-28"
                aria-label="قيمة الخيار الثاني"
                onChange={(e) => setOpt2({ ...opt2, amount: Number(e.target.value) })} />
            </div>
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="بنود الشروط">
        {(clauses ?? []).map((c) => (
          <button key={c.id} type="button" aria-pressed={pickedClauses.has(c.id)}
            onClick={() =>
              setPickedClauses((prev) => {
                const next = new Set(prev);
                if (next.has(c.id)) next.delete(c.id);
                else next.add(c.id);
                return next;
              })
            }
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
              pickedClauses.has(c.id)
                ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                : 'border-gray-dark text-gray-light'
            }`}>
            {c.title_ar}
          </button>
        ))}
      </div>

      {err && <p role="alert" className="text-xs text-pulse-orange">{err}</p>}

      <div className="flex gap-2">
        <Button size="sm" loading={save.isPending}
          disabled={!payload || payload.items.length === 0}
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
        <iframe
          title="معاينة عرض السعر"
          srcDoc={renderQuote(payload)}
          className="h-[600px] w-full rounded-sm border border-gray-dark bg-white"
        />
      )}
    </div>
  );
}

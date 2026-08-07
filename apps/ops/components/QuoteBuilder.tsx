'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@agma/ui';
import type { Tables } from '@agma/db';
import {
  COMPANY,
  renderQuote,
  type QuoteItem,
  type QuotePayload,
} from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';

type Client = Tables<'clients'>;
type Account = Pick<
  Tables<'payment_accounts'>,
  'id' | 'iban' | 'bank_name' | 'beneficiary_name' | 'is_default'
>;
type Clause = Tables<'clause_library'>;

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function todayAr(): string {
  const d = new Date();
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const emptyItem = (): QuoteItem => ({ title: '', description: '', amount: 0 });

export default function QuoteBuilder({ clients, onDone }:
  { clients: Client[]; onDone: () => void }) {
  const [clientId, setClientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [intro, setIntro] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [discountLabel, setDiscountLabel] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [pickedClauses, setPickedClauses] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase
      .from('payment_accounts')
      .select('id, iban, bank_name, beneficiary_name, is_default')
      .eq('active', true)
      .then(({ data }) => {
        setAccounts(data ?? []);
        const def = data?.find((a) => a.is_default);
        if (def) setAccountId(def.id);
      });
    supabase
      .from('clause_library')
      .select('*')
      .eq('approved', true)
      .order('sort')
      .then(({ data }) => {
        setClauses(data ?? []);
        setPickedClauses(new Set((data ?? []).filter((c) => c.category === 'commercial').map((c) => c.id)));
      });
  }, []);

  const payload = useMemo<QuotePayload | null>(() => {
    const account = accounts.find((a) => a.id === accountId);
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
      options: [],
      vatEnabled: false,
      paymentAccount: {
        iban: account.iban,
        bankName: account.bank_name,
        beneficiaryName: account.beneficiary_name,
      },
      clauses: clauses
        .filter((c) => pickedClauses.has(c.id))
        .map((c) => ({ title: c.title_ar, body: c.body_ar })),
      totalPages: 2,
    };
  }, [accounts, accountId, clients, clientId, recipientName, projectName, intro, items, discountLabel, discountAmount, clauses, pickedClauses]);

  function setItem(i: number, patch: Partial<QuoteItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function saveDraft() {
    if (!payload || !clientId) return;
    setBusy(true);
    await getSupabase().from('documents').insert({
      type: 'quote',
      client_id: clientId,
      payload: payload as never,
      payment_account_id: accountId,
    });
    setBusy(false);
    onDone();
  }

  const inputCls =
    'rounded-sm border border-gray-dark bg-transparent px-2 py-1.5 text-sm';

  return (
    <div className="mb-4 space-y-3 rounded-sm border border-gray-dark p-4">
      <div className="flex flex-wrap gap-2">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}
          className={`${inputCls} bg-pure-ink`}>
          <option value="">— العميل —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company}</option>
          ))}
        </select>
        <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
          placeholder="اسم المستلم (السيد / ...)" className={inputCls} />
        <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
          placeholder="اسم المشروع" className={inputCls} />
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
          className={`${inputCls} bg-pure-ink`} dir="ltr">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.iban.slice(0, 4)}…{a.iban.slice(-4)} — {a.bank_name}
            </option>
          ))}
        </select>
      </div>
      <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2}
        placeholder="مقدمة العرض…" className={`${inputCls} w-full`} />

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <span className="w-6 text-xs text-gray-medium">{String(i + 1).padStart(2, '0')}</span>
            <input value={item.title} onChange={(e) => setItem(i, { title: e.target.value })}
              placeholder="الخدمة" className={`${inputCls} w-44`} />
            <input value={item.description ?? ''} onChange={(e) => setItem(i, { description: e.target.value })}
              placeholder="الوصف (· بين الميزات)" className={`${inputCls} flex-1`} />
            <input type="number" value={item.amount || ''} onChange={(e) => setItem(i, { amount: Number(e.target.value) })}
              placeholder="SAR" className={`${inputCls} w-24`} dir="ltr" />
            <input type="number" value={item.originalAmount || ''} onChange={(e) => setItem(i, { originalAmount: Number(e.target.value) || undefined })}
              placeholder="قبل الخصم" className={`${inputCls} w-24`} dir="ltr" />
            <label className="flex items-center gap-1 text-xs text-gray-medium">
              <input type="checkbox" checked={!!item.noDiscount}
                onChange={(e) => setItem(i, { noDiscount: e.target.checked })} />
              بدون خصم
            </label>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" className="px-3 py-1 text-xs"
            onClick={() => setItems((p) => [...p, emptyItem()])}>+ بند</Button>
          <input value={discountLabel} onChange={(e) => setDiscountLabel(e.target.value)}
            placeholder="اسم الخصم (اختياري)" className={inputCls} />
          <input type="number" value={discountAmount || ''} onChange={(e) => setDiscountAmount(Number(e.target.value))}
            placeholder="قيمة الخصم" className={`${inputCls} w-28`} dir="ltr" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {clauses.map((c) => (
          <button key={c.id} type="button"
            onClick={() =>
              setPickedClauses((prev) => {
                const next = new Set(prev);
                if (next.has(c.id)) next.delete(c.id);
                else next.add(c.id);
                return next;
              })
            }
            className={`rounded-full border px-2.5 py-1 text-xs ${
              pickedClauses.has(c.id)
                ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                : 'border-gray-dark text-gray-light'
            }`}>
            {c.title_ar}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={saveDraft} disabled={busy || !payload || (payload.items.length === 0)}
          className="px-4 py-1.5 text-sm">
          حفظ كمسودة
        </Button>
        <Button variant="outline" className="px-4 py-1.5 text-sm" disabled={!payload}
          onClick={() => setPreview((v) => !v)}>
          {preview ? 'إخفاء المعاينة' : 'معاينة'}
        </Button>
      </div>

      {preview && payload && (
        <iframe
          title="معاينة"
          srcDoc={renderQuote(payload)}
          className="h-[600px] w-full rounded-sm border border-gray-dark bg-white"
        />
      )}
    </div>
  );
}

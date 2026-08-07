'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Select, Textarea } from '@agma/ui';
import type { Enums, Tables } from '@agma/db';
import { COMPANY, renderContract, type ContractPayload } from '@agma/legal-templates';
import { getSupabase } from '../lib/supabase';
import { keys, useAppMutation, useClauses, useOrgSettings } from '../lib/queries';

type Client = Tables<'clients'>;

const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const todayAr = () => {
  const d = new Date();
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * مكتبة القوالب (docs/13): فئة ← نوع ← بنوده الجاهزة من مكتبة البنود.
 * كل قالب يعرّف بنوده وتلميح «الحزمة المقترحة» معه.
 */
type TemplateDef = {
  key: string;
  type: Enums<'document_type'>;
  title: string;
  clauseCategories: string[];
  preamble?: string;
  bundleHint?: string;
};

const TEMPLATE_GROUPS: { group: string; templates: TemplateDef[] }[] = [
  {
    group: 'اتفاقيات العملاء الأساسية',
    templates: [
      { key: 'msa', type: 'msa', title: 'اتفاقية خدمات رئيسية (الإطار)', clauseCategories: ['legal', 'commercial'],
        bundleHint: 'الحزمة المعتادة: رئيسية + بيان نطاق لكل خدمة + معالجة بيانات عند الحاجة.' },
      { key: 'sow', type: 'sow', title: 'بيان نطاق عمل (SOW)', clauseCategories: ['sow'],
        bundleHint: 'يُبنى تحت الاتفاقية الرئيسية — بيان لكل مشروع أو خدمة.' },
      { key: 'change_order', type: 'change_order', title: 'أمر تغيير', clauseCategories: ['change_order'],
        bundleHint: 'يعدل بيان نطاق قائماً — اذكر مرجعه في اسم المشروع.' },
      { key: 'sla', type: 'sla', title: 'اتفاقية مستوى الخدمة', clauseCategories: ['legal'] },
      { key: 'amc', type: 'amc', title: 'عقد صيانة سنوي', clauseCategories: ['legal'] },
      { key: 'coc', type: 'coc', title: 'ميثاق التعاون', clauseCategories: ['legal'] },
    ],
  },
  {
    group: 'السرية',
    templates: [
      { key: 'nda_mutual', type: 'nda', title: 'اتفاقية سرية متبادلة', clauseCategories: ['nda'],
        preamble: 'حيث إن الطرفين بصدد تبادل معلومات ذات طبيعة سرية لغرض بحث أو تنفيذ تعاون تجاري بينهما، فقد اتفقا على ما يلي:' },
      { key: 'nda_oneway', type: 'nda', title: 'اتفاقية سرية أحادية الاتجاه', clauseCategories: ['nda_oneway', 'nda'],
        preamble: 'حيث إن الطرف الأول (المفصح) سيكشف للطرف الثاني (المتلقي) معلومات ذات طبيعة سرية لغرض محدد، فقد اتفق الطرفان على ما يلي:' },
    ],
  },
  {
    group: 'البيانات والإعلانات والمؤثرون',
    templates: [
      { key: 'dpa', type: 'dpa', title: 'اتفاقية معالجة بيانات (PDPL)', clauseCategories: ['dpa'],
        bundleHint: 'إلزامية عندما نعالج بيانات عملاء العميل (تحليلات، حملات، CRM).' },
      { key: 'media_auth', type: 'media_auth', title: 'تفويض الميزانية الإعلانية', clauseCategories: ['media_auth'],
        bundleHint: 'لا تُدار حملة مدفوعة بدون هذا التفويض — يحدد السقف ومسار الدفع والأتعاب.' },
      { key: 'influencer', type: 'influencer', title: 'اتفاقية مؤثر / صانع محتوى', clauseCategories: ['influencer'],
        bundleHint: 'هذه بين أجما والمؤثر — عقد العميل لإدارة الحملة مستقل عنها.' },
    ],
  },
  {
    group: 'الخدمات والاشتراكات (docs/14)',
    templates: [
      { key: 'service', type: 'service', title: 'اتفاقية تقديم خدمات (صفقة واحدة)',
        clauseCategories: ['service', 'legal'],
        bundleHint: 'للصفقة المستقلة بدون اتفاقية رئيسية — أرفق ملحق الملكية الفكرية ومعالجة البيانات عند الحاجة.' },
      { key: 'retainer', type: 'retainer', title: 'اتفاقية خدمات شهرية (اشتراك)',
        clauseCategories: ['retainer', 'legal'],
        bundleHint: 'عقد الاشتراك — فوترته الشهرية تُدار من المالية ← الاشتراكات.' },
    ],
  },
  {
    group: 'الشركاء والموردون',
    templates: [
      { key: 'partnership', type: 'partnership', title: 'شراكة وتعاون تجاري',
        clauseCategories: ['partnership'],
        bundleHint: 'لا تنشئ شركة أو تضامناً — كل فرصة مشتركة بوثيقتها المستقلة.' },
      { key: 'contractor', type: 'contractor', title: 'اتفاقية مقاول مستقل',
        clauseCategories: ['contractor'],
        bundleHint: 'وقّعها مع كل مستقل قبل أول مهمة — تشمل السرية والملكية وحظر أدوات الذكاء الاصطناعي العامة.' },
      { key: 'referral', type: 'referral', title: 'اتفاقية إحالة',
        clauseCategories: ['referral'],
        bundleHint: 'العمولة تستحق بعد التحصيل الفعلي — والإحالة تُسجل قبل وجود فرصة نشطة.' },
    ],
  },
  {
    group: 'الملكية والمحتوى',
    templates: [
      { key: 'licensing', type: 'licensing', title: 'ترخيص محتوى',
        clauseCategories: ['licensing'],
        bundleHint: 'حدد المنصات والمدة والإعلانات المدفوعة صراحة — غير المذكور غير مشمول.' },
      { key: 'ip_addendum', type: 'ip_addendum', title: 'ملحق ملكية فكرية وترخيص',
        clauseCategories: ['ip_addendum'],
        bundleHint: 'أرفقه بالعقد عندما يطلب العميل ملكية المخرجات — الانتقال بعد السداد الكامل فقط.' },
    ],
  },
  {
    group: 'الاستلام والتجديد والإغلاق',
    templates: [
      { key: 'acceptance', type: 'acceptance', title: 'محضر استلام وقبول',
        clauseCategories: ['acceptance'],
        bundleHint: 'أقفل به كل مشروع — يوثق تسليم الحسابات والمصادقة الثنائية وتدوير المفاتيح.' },
      { key: 'renewal', type: 'renewal', title: 'ملحق تجديد وتمديد',
        clauseCategories: ['renewal'],
        preamble: 'بالإشارة إلى الاتفاقية المبرمة بين الطرفين والمحدد رقمها وتاريخها أدناه، اتفق الطرفان على تمديدها وفق ما يلي:' },
      { key: 'termination_mutual', type: 'termination', title: 'اتفاقية إنهاء بالتراضي',
        clauseCategories: ['termination'],
        preamble: 'بالإشارة إلى الاتفاقية المبرمة بين الطرفين، اتفقا على إنهائها بالتراضي وفق الأحكام التالية:' },
      { key: 'termination_notice', type: 'termination', title: 'إشعار إنهاء',
        clauseCategories: ['termination'],
        preamble: 'بموجب هذا الإشعار يمارس الطرف الأول حقه في إنهاء الاتفاقية المشار إليها استناداً إلى مادتها المنظِّمة للإنهاء، وفق ما يلي:',
        bundleHint: 'إشعار أحادي — ليس مخالصة؛ عند تسوية خلاف استخدم «تسوية ومخالصة».' },
      { key: 'settlement', type: 'settlement', title: 'اتفاقية تسوية ومخالصة',
        clauseCategories: ['settlement'],
        bundleHint: 'حدد نطاق المخالصة والمستثنيات بدقة — لا مخالصة شاملة تلقائية.' },
      { key: 'authorization', type: 'authorization', title: 'خطاب تفويض',
        clauseCategories: ['authorization'],
        preamble: 'إلى من يهمه الأمر،' },
    ],
  },
];

/**
 * Contract builder (docs/03): NDA in three clicks — pick client, clauses
 * arrive pre-approved from the library, preview, save draft. Finalization
 * (numbering + freeze) stays in the documents list like every document.
 */
export default function ContractBuilder({ clients, onDone }:
  { clients: Client[]; onDone: () => void }) {
  const { data: clauses } = useClauses();
  const { data: org } = useOrgSettings();
  const [templateKey, setTemplateKey] = useState('nda_mutual');
  const [clientId, setClientId] = useState('');
  const [secondPartyRep, setSecondPartyRep] = useState('');
  const [preamble, setPreamble] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [extraTitle, setExtraTitle] = useState('');
  const [extraBody, setExtraBody] = useState('');
  const [extras, setExtras] = useState<{ title: string; body: string }[]>([]);
  const [preview, setPreview] = useState(false);

  const meta = TEMPLATE_GROUPS.flatMap((g) => g.templates)
    .find((t) => t.key === templateKey)!;
  const client = clients.find((c) => c.id === clientId);
  const available = useMemo(
    () => (clauses ?? []).filter((c) => c.approved &&
      (meta.clauseCategories.includes(c.category)
        || (meta.type !== 'nda' && c.category === 'commercial'))),
    [clauses, meta]
  );
  // القالب يحدد بنوده الافتراضية كاملة؛ التجاري إضافة اختيارية.
  const effective = picked ?? new Set(
    available.filter((c) => meta.clauseCategories.includes(c.category)).map((c) => c.id)
  );

  const payload = useMemo<ContractPayload | null>(() => {
    if (!client) return null;
    return {
      docTitleAr: meta.title,
      number: null,
      issueDateAr: todayAr(),
      city: org?.city ?? COMPANY.city,
      // الهوية من «الإعدادات ← بيانات المنشأة» (docs/14 §1) — الثوابت احتياط فقط
      firstParty: {
        name: org?.legal_name ?? COMPANY.legalNameAr,
        descriptor: [
          `س.ت ${org?.cr_number ?? COMPANY.cr}`,
          org?.city ?? COMPANY.city,
          org?.representative_name &&
            `يمثلها: ${org.representative_name}${org.representative_title ? ` بصفته ${org.representative_title}` : ''}`,
        ].filter(Boolean).join(' — '),
      },
      secondParty: {
        name: client.company,
        descriptor: [
          client.cr_number && `س.ت ${client.cr_number}`,
          client.city,
          secondPartyRep && `يمثلها: ${secondPartyRep}`,
        ].filter(Boolean).join(' — ') || undefined,
      },
      preamble: preamble || meta.preamble,
      clauses: [
        ...available.filter((c) => effective.has(c.id))
          .map((c) => ({ title: c.title_ar, body: c.body_ar })),
        ...extras,
      ],
    };
  }, [client, org, meta, secondPartyRep, preamble, available, effective, extras]);

  const save = useAppMutation(
    async () => {
      if (!payload) throw new Error('اختر العميل أولاً');
      if (payload.clauses.length === 0) throw new Error('اختر بنداً واحداً على الأقل');
      const { error } = await getSupabase().from('documents').insert({
        type: meta.type,
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
        <Select label="القالب (فئة ← نوع)" value={templateKey}
          onChange={(e) => {
            setTemplateKey(e.target.value);
            setPicked(null);
          }}>
          {TEMPLATE_GROUPS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.templates.map((t) => <option key={t.key} value={t.key}>{t.title}</option>)}
            </optgroup>
          ))}
        </Select>
        <Select label="العميل (الطرف الثاني)" value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            const c = clients.find((x) => x.id === e.target.value);
            if (c?.decision_maker && !secondPartyRep) setSecondPartyRep(c.decision_maker);
          }}>
          <option value="">— اختر —</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.company}</option>)}
        </Select>
        <Input label="ممثل الطرف الثاني (اختياري)" value={secondPartyRep}
          onChange={(e) => setSecondPartyRep(e.target.value)} />
        <Input label="تاريخ انتهاء العقد (تنبيه تجديد قبل ٦٠ و٣٠ يوماً)"
          type="date" dir="ltr" value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)} />
      </div>
      {meta.bundleHint && (
        <p className="text-xs text-pulse-orange/90">{meta.bundleHint}</p>
      )}
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
          {extras.length > 0 && (
            <p className="text-xs text-pulse-orange/90">
              بند مخصص خارج المكتبة — اطلب مراجعة المستشار القانوني (زر المراجعات
              على المستند بعد الحفظ) قبل الاعتماد.
            </p>
          )}
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

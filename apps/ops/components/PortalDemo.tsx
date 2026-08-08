'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Badge, Button, Card, Input, Modal, Tabs, ToastProvider, useToast,
} from '@agma/ui';
import {
  Activity, BarChart3, CheckCircle2, FileText, FolderKanban, Landmark,
  MapPin, PenLine, Sparkles, TestTubeDiagonal, TrendingUp,
} from 'lucide-react';

/**
 * Experience AGMA 2.0 — «سستم يبهر»: بوابة كاملة تتنفس ببيانات افتراضية
 * غنية، كلها داخل المتصفح (لا حساب، لا قاعدة، لا أثر). الميزة القاتلة —
 * التعليق بالدبابيس على تصميم فعلي — تعمل هنا بالكامل على تصميم SVG مضمّن.
 */

const DEMO_COMPANY = 'شركة الأفق للتطوير العقاري';

/**
 * إعلان الديمو: خلفية مولّدة بالذكاء الاصطناعي (برج فاخر على الواجهة البحرية
 * وقت الغروب — أنتجناها بأدوات AGMA نفسها) + نص عربي مركّب بطباعة HTML حادة
 * فوقها، كما يخرج الإعلان من استوديو فعلي. الدبابيس تعمل فوق التركيبة كلها.
 */
function DemoAdArtwork() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/demo/ad-bg.webp" alt="تصميم إعلان الوحدات"
        className="block w-full select-none" draggable={false} />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-[6%] text-start">
        <div>
          <p className="text-[2.6cqw] font-bold tracking-wide text-white/80"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,.6)' }}>
            مشروع الأفق ريزيدنس
          </p>
        </div>
        <div>
          <p className="text-[7cqw] font-black leading-tight text-white"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,.7)' }}>
            وحدات فاخرة
          </p>
          <p className="mt-1 text-[4cqw] font-bold text-pulse-orange"
            style={{ textShadow: '0 1px 10px rgba(0,0,0,.8)' }}>
            بإطلالة على الواجهة البحرية
          </p>
          <span className="mt-[3%] inline-block rounded-full bg-pulse-orange px-[5%] py-[1.8%] text-[2.8cqw] font-black text-void shadow-lg">
            سجّل اهتمامك
          </span>
          <p className="mt-[3%] text-[2cqw] text-white/60" dir="ltr"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,.6)' }}>
            alofuq.sa · 920000000
          </p>
        </div>
      </div>
    </>
  );
}

type Pin = { x: number; y: number; body: string };

export default function PortalDemo() {
  return (
    <ToastProvider>
      <DemoInner />
    </ToastProvider>
  );
}

function DemoInner() {
  const toast = useToast();
  const [tab, setTab] = useState('home');
  const [approval, setApproval] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [contractSigned, setContractSigned] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signing, setSigning] = useState(false);
  const [dlvStatus, setDlvStatus] = useState<'pending' | 'approved' | 'changes'>('pending');
  const [pins, setPins] = useState<Pin[]>([
    { x: 0.28, y: 0.87, body: 'اجعلوا زر التسجيل أكبر قليلاً' },
  ]);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(null);
  const [pinText, setPinText] = useState('');
  const [changeNote, setChangeNote] = useState<string | null>(null);

  const doneActions = (approval !== 'pending') && contractSigned && dlvStatus !== 'pending';
  const pendingCount = [approval === 'pending', !contractSigned, dlvStatus === 'pending']
    .filter(Boolean).length;

  const timeline = useMemo(() => [
    ...(dlvStatus === 'approved' ? [{ t: 'الآن', e: 'اعتمدتَ تصميم «إعلان الوحدات» V3 ✓' }] : []),
    ...(contractSigned ? [{ t: 'الآن', e: `وقّع ${signerName || 'ممثلكم'} اتفاقية الخدمات إلكترونياً` }] : []),
    { t: 'قبل ساعتين', e: 'رفع فريق AGMA الإصدار الثالث من تصميم الإعلان' },
    { t: 'قبل ٥ ساعات', e: 'اكتمل فحص جودة صفحة الهبوط (١٢/١٢ ✓)' },
    { t: 'أمس', e: 'حملة سناب شات حققت ٤٢ تسجيل اهتمام جديداً' },
    { t: 'أمس', e: 'قُيدت دفعتكم — شكراً لكم (SAR 9,200)' },
    { t: 'قبل يومين', e: 'نُشر مقال «دليل التملك في الواجهة البحرية»' },
    { t: 'قبل ٣ أيام', e: 'اجتماع المتابعة الأسبوعي — الملخص في الملفات' },
  ], [dlvStatus, contractSigned, signerName]);

  return (
    <div dir="rtl" className="min-h-screen">
      <div className="border-b border-pulse-orange/40 bg-pulse-orange/10 px-4 py-2">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 text-xs">
          <TestTubeDiagonal className="h-4 w-4 text-pulse-orange" aria-hidden />
          <b>وضع تجريبي</b>
          <span className="text-gray-light">— بيانات افتراضية، لا يُحفظ شيء. هذه البوابة نفسها لعملاء AGMA.</span>
          <a href="https://agma.com.sa/contact" target="_blank" rel="noreferrer"
            className="ms-auto rounded-md bg-pulse-orange px-3 py-1 font-bold text-void hover:opacity-90">
            اجعلها بوابتك — احجز مكالمة
          </a>
        </div>
      </div>

      <header className="border-b border-gray-dark px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="text-lg font-black text-pulse-orange">AGMA</span>
          <span className="text-sm text-gray-light">بوابة {DEMO_COMPANY}</span>
          <span className="ms-auto text-sm text-gray-medium">مساء الخير، خالد 👋</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* لوحة الإحصاءات — أول ما يبهر */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'تقدم المشروع', value: '68%', icon: TrendingUp },
            { label: 'مهام مكتملة', value: '34 / 50', icon: CheckCircle2 },
            { label: 'بانتظار قرارك', value: String(pendingCount), icon: Sparkles,
              alarm: pendingCount > 0 },
            { label: 'عائد الحملات', value: '3.4x', icon: BarChart3 },
          ].map((c) => (
            <Card key={c.label} className={`p-4 ${c.alarm ? 'border-pulse-orange/60' : ''}`}>
              <c.icon className="mb-2 h-4 w-4 text-pulse-orange" aria-hidden />
              <p className={`text-2xl font-black ${c.alarm ? 'text-pulse-orange' : ''}`}>{c.value}</p>
              <p className="text-xs text-gray-medium">{c.label}</p>
            </Card>
          ))}
        </div>

        <Tabs active={tab} onChange={setTab} tabs={[
          { key: 'home', label: 'نظرة عامة' },
          { key: 'dlv', label: 'المخرجات' },
          { key: 'project', label: 'المشروع' },
          { key: 'docs', label: 'المستندات' },
          { key: 'reports', label: 'التقارير' },
          { key: 'pay', label: 'الفواتير' },
        ]} />

        <div className="mt-5 space-y-4">
          {tab === 'home' && (
            <>
              <Card className={`p-4 ${doneActions ? '' : 'border-pulse-orange/50'}`}>
                <p className="mb-3 flex items-center gap-2 font-bold">
                  <Sparkles className="h-4 w-4 text-pulse-orange" aria-hidden />
                  بانتظار قرارك — جرّب بنفسك
                </p>
                {approval === 'pending' && (
                  <ActionRow label="اعتماد نطاق عمل: حملة إطلاق «الأفق ريزيدنس»">
                    <Button size="xs" onClick={() => { setApproval('approved'); toast.success('اعتمدتَ النطاق بنقرة — الفريق ينطلق فوراً'); }}>اعتماد</Button>
                    <Button variant="ghost" size="xs" onClick={() => { setApproval('rejected'); toast.success('سُجلت ملاحظاتك'); }}>لدي ملاحظات</Button>
                  </ActionRow>
                )}
                {!contractSigned && (
                  <ActionRow label="اتفاقية الخدمات CT-00023 بانتظار توقيعك الإلكتروني">
                    <Button size="xs" onClick={() => setSigning(true)}>
                      <PenLine className="h-3.5 w-3.5" aria-hidden /> وقّع الآن
                    </Button>
                  </ActionRow>
                )}
                {dlvStatus === 'pending' && (
                  <ActionRow label="تصميم «إعلان الوحدات» V3 بانتظار اعتمادك — علّق على أي نقطة منه">
                    <Button size="xs" onClick={() => setTab('dlv')}>افتحه</Button>
                  </ActionRow>
                )}
                {doneActions && (
                  <p className="text-sm text-gray-light">
                    أنجزت كل شيء ✓ — هكذا تبدو الراحة مع AGMA: قرارات بنقرة، وكل شيء موثق.
                  </p>
                )}
              </Card>

              <Card className="p-4">
                <p className="mb-3 flex items-center gap-2 font-bold">
                  <Activity className="h-4 w-4 text-pulse-orange" aria-hidden />
                  ماذا يحدث في حسابك الآن
                </p>
                <ul className="space-y-2">
                  {timeline.map((x, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-20 shrink-0 text-xs text-gray-medium">{x.t}</span>
                      <span className="text-gray-light">{x.e}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}

          {tab === 'dlv' && (
            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">إعلان الوحدات — سوشال ميديا</span>
                <Badge variant="outline">الإصدار 3</Badge>
                <Badge variant={dlvStatus === 'approved' ? 'accent' : dlvStatus === 'changes' ? 'outline' : 'neutral'}>
                  {{ pending: 'بانتظار اعتمادك', approved: 'معتمد ✓', changes: 'طلبت تعديلات' }[dlvStatus]}
                </Badge>
                <span className="ms-auto text-xs text-gray-medium">V1 ↻ · V2 ↻ · V3</span>
              </div>
              {dlvStatus === 'pending' && (
                <p className="mb-2 text-xs text-pulse-orange">
                  اضغط على أي نقطة من التصميم لتثبيت تعليق عليها بالضبط — جرّبها.
                </p>
              )}
              <div className="relative inline-block w-full max-w-[480px] overflow-hidden rounded-sm"
                style={{ containerType: 'inline-size',
                  cursor: dlvStatus === 'pending' ? 'crosshair' : undefined }}
                onClick={(e) => {
                  if (dlvStatus !== 'pending') return;
                  const r = e.currentTarget.getBoundingClientRect();
                  setDraftPin({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
                  setPinText('');
                }}>
                <DemoAdArtwork />
                {pins.map((p, i) => (
                  <span key={i}
                    className="absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-pulse-orange text-xs font-black text-void shadow"
                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} title={p.body}>
                    {i + 1}
                  </span>
                ))}
                {draftPin && (
                  <span className="absolute grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse place-items-center rounded-full border-2 border-pulse-orange bg-void text-xs text-pulse-orange"
                    style={{ left: `${draftPin.x * 100}%`, top: `${draftPin.y * 100}%` }}>+</span>
                )}
              </div>
              {draftPin && (
                <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-pulse-orange/50 p-2">
                  <Input label="تعليقك على هذه النقطة" className="min-w-64" value={pinText}
                    onChange={(e) => setPinText(e.target.value)} />
                  <Button size="xs" disabled={pinText.trim().length < 3}
                    onClick={() => {
                      setPins((p) => [...p, { ...draftPin, body: pinText.trim() }]);
                      setDraftPin(null);
                      toast.success('ثُبّت تعليقك — سيراه المصمم بمكانه بالضبط');
                    }}>
                    ثبّت التعليق
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setDraftPin(null)}>إلغاء</Button>
                </div>
              )}
              <ul className="mt-3 space-y-1 text-xs text-gray-light">
                {pins.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-pulse-orange" aria-hidden />
                    <span><b className="text-pulse-orange">{i + 1}.</b> {p.body}</span>
                  </li>
                ))}
              </ul>
              {dlvStatus === 'pending' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => { setDlvStatus('approved'); toast.success('اعتمدت التصميم — الفريق أُشعر وسننشره بالجدول'); }}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> اعتماد التصميم
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setChangeNote('')}>
                    أطلب تعديلات
                  </Button>
                </div>
              )}
              {changeNote !== null && dlvStatus === 'pending' && (
                <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-2">
                  <Input label="ما التعديلات المطلوبة؟" className="min-w-72" value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)} />
                  <Button size="xs" disabled={(changeNote ?? '').trim().length < 5}
                    onClick={() => { setDlvStatus('changes'); setChangeNote(null); toast.success('أُرسلت ملاحظاتك — سيصلك V4 قريباً'); }}>
                    إرسال
                  </Button>
                </div>
              )}
            </Card>
          )}

          {tab === 'project' && (
            <>
              <Card className="p-4">
                <p className="mb-3 flex items-center gap-2 font-bold">
                  <FolderKanban className="h-4 w-4 text-pulse-orange" aria-hidden />
                  إطلاق الهوية والمنصة الرقمية
                  <Badge variant="accent" className="ms-2">قيد التنفيذ · 68%</Badge>
                </p>
                <div className="space-y-3">
                  {[
                    { s: 'التحليل والاستراتيجية', p: 100 },
                    { s: 'الهوية البصرية', p: 100 },
                    { s: 'الموقع وصفحات الهبوط', p: 80 },
                    { s: 'الحملات والإطلاق', p: 35 },
                    { s: 'القياس والتحسين', p: 0 },
                  ].map((st) => (
                    <div key={st.s}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className={st.p === 100 ? 'text-gray-light' : 'font-bold'}>
                          {st.p === 100 ? '✓ ' : ''}{st.s}
                        </span>
                        <span dir="ltr" className="text-xs text-gray-medium">{st.p}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-dark">
                        <div className="h-full rounded-full bg-pulse-orange transition-all"
                          style={{ width: `${st.p}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <p className="mb-2 text-sm font-bold">أحدث المهام</p>
                {[
                  { t: 'صفحة هبوط «سجّل اهتمامك»', s: 'مكتملة ✓' },
                  { t: 'إعداد التتبع والتحويلات', s: 'مكتملة ✓' },
                  { t: 'تصاميم حملة الإطلاق (٦ إعلانات)', s: 'قيد العمل' },
                  { t: 'جدولة محتوى الشهر الأول', s: 'قيد العمل' },
                ].map((x) => (
                  <div key={x.t} className="mb-1.5 flex items-center gap-2 text-sm">
                    <span className="text-gray-light">{x.t}</span>
                    <Badge variant={x.s.includes('✓') ? 'accent' : 'neutral'} className="ms-auto">{x.s}</Badge>
                  </div>
                ))}
              </Card>
            </>
          )}

          {tab === 'docs' && (
            <>
              {[
                { n: 'CT-00023', t: 'اتفاقية خدمات', st: contractSigned ? 'موقَّع ✓' : 'بانتظار توقيعك', act: !contractSigned },
                { n: 'Q-00071', t: 'عرض سعر', st: 'موقَّع ✓' },
                { n: 'SOW-011', t: 'بيان نطاق عمل', st: approval === 'approved' ? 'معتمد ✓' : 'مرسل' },
                { n: 'NDA-004', t: 'اتفاقية سرية', st: 'نشط' },
              ].map((d) => (
                <Card key={d.n} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <Badge>{d.t}</Badge>
                  <b dir="ltr">{d.n}</b>
                  <Badge variant={d.st.includes('✓') || d.st === 'نشط' ? 'accent' : 'neutral'}>{d.st}</Badge>
                  {contractSigned && d.n === 'CT-00023' && (
                    <span className="text-xs text-gray-medium">
                      وقّعه {signerName} · اليوم · سجل الأدلة محفوظ (الوقت + بصمة المحتوى)
                    </span>
                  )}
                  <span className="ms-auto flex gap-2">
                    <Button variant="ghost" size="xs"
                      onClick={() => toast.success('في البوابة الحقيقية يُفتح المستند كاملاً بهوية AGMA وختمها للطباعة')}>
                      معاينة
                    </Button>
                    {d.act && <Button size="xs" onClick={() => setSigning(true)}>وقّع</Button>}
                  </span>
                </Card>
              ))}
            </>
          )}

          {tab === 'reports' && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { l: 'زيارات هذا الشهر', v: '12,481', d: '+18%' },
                  { l: 'تسجيلات اهتمام', v: '392', d: '+22%' },
                  { l: 'تكلفة التسجيل', v: 'SAR 41', d: '-13%' },
                  { l: 'عائد الإنفاق', v: '3.4x', d: '+0.6' },
                ].map((k) => (
                  <Card key={k.l} className="p-4">
                    <p className="text-xl font-black">{k.v}</p>
                    <p className="text-xs text-gray-medium">{k.l}</p>
                    <p className="mt-1 text-xs font-bold text-pulse-orange" dir="ltr">{k.d}</p>
                  </Card>
                ))}
              </div>
              <Card className="p-4">
                <p className="mb-3 text-sm font-bold">تسجيلات الاهتمام أسبوعياً</p>
                <div className="flex h-36 items-end gap-2">
                  {[34, 51, 42, 68, 79, 74, 92, 88].map((v, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-pulse-orange/80 transition-all hover:bg-pulse-orange"
                      style={{ height: `${v}%` }} title={`الأسبوع ${i + 1}: ${v}`} />
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-medium">
                  الأسابيع الثمانية الأخيرة — من التتبع الفعلي لا من تقديرات المنصات.
                </p>
              </Card>
              <Card className="p-4">
                <p className="mb-2 text-sm font-bold">قمع التحويل</p>
                {[
                  { s: 'زيارة الصفحة', v: 12481, p: 100 },
                  { s: 'بدء التسجيل', v: 1310, p: 44 },
                  { s: 'تسجيل مكتمل', v: 392, p: 22 },
                  { s: 'موعد معاينة', v: 87, p: 9 },
                ].map((f) => (
                  <div key={f.s} className="mb-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-light">{f.s}</span>
                      <span dir="ltr" className="text-gray-medium">{f.v.toLocaleString('en-US')}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-dark">
                      <div className="h-full rounded-full bg-pulse-orange" style={{ width: `${f.p}%` }} />
                    </div>
                  </div>
                ))}
              </Card>
            </>
          )}

          {tab === 'pay' && (
            <>
              {[
                { n: 'INV-00058', total: 18400, paid: 9200 },
                { n: 'INV-00051', total: 12000, paid: 12000 },
              ].map((inv) => {
                const bal = inv.total - inv.paid;
                return (
                  <Card key={inv.n} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <b dir="ltr">{inv.n}</b>
                    <span dir="ltr" className="font-bold">SAR {inv.total.toLocaleString('en-US')}</span>
                    <Badge variant={bal <= 0 ? 'accent' : 'outline'}>
                      {bal <= 0 ? 'مسددة — شكراً لك' : `متبقٍ SAR ${bal.toLocaleString('en-US')}`}
                    </Badge>
                  </Card>
                );
              })}
              <Card className="p-4">
                <p className="mb-2 flex items-center gap-2 font-bold">
                  <Landmark className="h-4 w-4 text-pulse-orange" aria-hidden />
                  حسابات التحويل البنكي
                </p>
                <p className="text-sm">
                  <span className="text-gray-light">مصرف الراجحي</span>{' · '}
                  <span dir="ltr" className="font-mono text-xs">SA00 0000 DEMO 0000 0000 0000</span>
                </p>
                <p className="mt-2 text-xs text-gray-medium">
                  المستفيد: مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية
                </p>
              </Card>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-gray-medium">
          أعجبتك التجربة؟{' '}
          <a href="https://agma.com.sa/contact" target="_blank" rel="noreferrer"
            className="font-bold text-pulse-orange underline-offset-2 hover:underline">
            احجز مكالمة استراتيجية
          </a>{' '}
          واحصل على بوابتك الحقيقية مع أول مشروع.
        </p>
      </main>

      <DemoSignModal open={signing} onClose={() => setSigning(false)}
        onSigned={(name) => {
          setContractSigned(true);
          setSignerName(name);
          setSigning(false);
          toast.success('تم التوقيع تجريبياً — في البوابة الحقيقية يُحفظ سجل أدلة كامل');
        }} />
    </div>
  );
}

function ActionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark p-3 text-sm">
      <FileText className="h-4 w-4 shrink-0 text-pulse-orange" aria-hidden />
      <span>{label}</span>
      <span className="ms-auto flex gap-2">{children}</span>
    </div>
  );
}

function DemoSignModal({ open, onClose, onSigned }: {
  open: boolean;
  onClose: () => void;
  onSigned: (name: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState('');

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  return (
    <Modal open={open} onClose={onClose} title="توقيع CT-00023 (تجريبي)">
      <div className="space-y-3">
        <p className="text-xs text-gray-medium">
          هذه تجربة التوقيع نفسها في البوابة الحقيقية — هناك يُحفظ توقيعك مع
          الوقت وبصمة محتوى المستند في سجل أدلة غير قابل للتعديل.
        </p>
        <Input label="الاسم الكامل للموقّع" value={name}
          onChange={(e) => setName(e.target.value)} />
        <div>
          <p className="mb-1.5 text-xs font-bold text-gray-light">ارسم توقيعك</p>
          <canvas ref={canvasRef} width={440} height={160}
            className="w-full touch-none rounded-sm border border-gray-dark bg-white"
            onPointerDown={(e) => {
              drawing.current = true;
              const ctx = e.currentTarget.getContext('2d')!;
              const { x, y } = pos(e);
              ctx.beginPath(); ctx.moveTo(x, y);
              ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a1a';
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drawing.current) return;
              const ctx = e.currentTarget.getContext('2d')!;
              const { x, y } = pos(e);
              ctx.lineTo(x, y); ctx.stroke();
              setHasInk(true);
            }}
            onPointerUp={() => { drawing.current = false; }} />
        </div>
        <Button className="w-full" disabled={!hasInk || name.trim().length < 3}
          onClick={() => onSigned(name.trim())}>
          <CheckCircle2 className="h-4 w-4" aria-hidden /> وقّع واعتمد (تجريبي)
        </Button>
      </div>
    </Modal>
  );
}

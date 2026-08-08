'use client';

import React, { useRef, useState } from 'react';
import {
  Badge, Button, Card, Input, Modal, Tabs, ToastProvider, useToast,
} from '@agma/ui';
import {
  CheckCircle2, FileText, Landmark, PenLine, Sparkles, TestTubeDiagonal,
} from 'lucide-react';

/**
 * Experience AGMA (WOW شريحة ٢): نسخة تجريبية كاملة من بوابة العميل —
 * بيانات افتراضية بالكامل داخل المتصفح: لا حساب، لا قاعدة بيانات، لا أثر.
 * كل تفاعل يعمل محلياً ليعيش الزائر التجربة الحقيقية قبل التعاقد.
 */

type DemoDoc = {
  id: string; type: string; number: string; status: 'sent' | 'signed' | 'active';
  total?: number; paid?: number;
  signedBy?: string; signedAt?: string;
};

const DEMO_COMPANY = 'شركة الأفق للتطوير العقاري (بيانات تجريبية)';

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
  const [approvals, setApprovals] = useState([
    { id: 'a1', label: 'نطاق عمل: حملة إطلاق المشروع السكني الجديد', status: 'pending' as string },
  ]);
  const [docs, setDocs] = useState<DemoDoc[]>([
    { id: 'd1', type: 'اتفاقية خدمات', number: 'CT-00023', status: 'sent' },
    { id: 'd2', type: 'عرض سعر', number: 'Q-00071', status: 'signed',
      signedBy: 'م. خالد الحربي', signedAt: '2026-08-02' },
    { id: 'd3', type: 'فاتورة', number: 'INV-00058', status: 'active',
      total: 18400, paid: 9200 },
  ]);
  const [signing, setSigning] = useState<DemoDoc | null>(null);

  const pendingSign = docs.filter((d) => d.status === 'sent');
  const invoices = docs.filter((d) => d.type === 'فاتورة');

  function decide(id: string, ok: boolean) {
    setApprovals((a) => a.map((x) => x.id === id
      ? { ...x, status: ok ? 'approved' : 'rejected' } : x));
    toast.success(ok ? 'تم الاعتماد — هكذا بنقرة واحدة' : 'سُجلت ملاحظاتك لفريق AGMA');
  }

  return (
    <div dir="rtl" className="min-h-screen">
      {/* لافتة الوضع التجريبي — دائمة وواضحة */}
      <div className="border-b border-pulse-orange/40 bg-pulse-orange/10 px-4 py-2">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 text-xs">
          <TestTubeDiagonal className="h-4 w-4 text-pulse-orange" aria-hidden />
          <b>وضع تجريبي</b>
          <span className="text-gray-light">
            — كل البيانات افتراضية ولا يُحفظ شيء. هذه هي البوابة نفسها التي يحصل عليها عملاء AGMA.
          </span>
          <a href="https://agma.com.sa/contact" target="_blank" rel="noreferrer"
            className="ms-auto rounded-md bg-pulse-orange px-3 py-1 font-bold text-void hover:opacity-90">
            اجعلها بوابتك — احجز مكالمة
          </a>
        </div>
      </div>

      <header className="border-b border-gray-dark px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <span className="text-lg font-black text-pulse-orange">AGMA</span>
          <span className="text-sm text-gray-light">بوابة {DEMO_COMPANY}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Tabs active={tab} onChange={setTab} tabs={[
          { key: 'home', label: 'نظرة عامة' },
          { key: 'docs', label: 'المستندات' },
          { key: 'pay', label: 'الفواتير والدفع' },
        ]} />

        <div className="mt-5 space-y-4">
          {tab === 'home' && (
            <>
              <Card className="border-pulse-orange/50 p-4">
                <p className="mb-3 flex items-center gap-2 font-bold">
                  <Sparkles className="h-4 w-4 text-pulse-orange" aria-hidden />
                  بانتظار قرارك — جرّبها
                </p>
                {approvals.map((a) => (
                  <div key={a.id} className="mb-2 flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark p-3 text-sm">
                    <span>{a.label}</span>
                    {a.status === 'pending' ? (
                      <span className="ms-auto flex gap-2">
                        <Button size="xs" onClick={() => decide(a.id, true)}>اعتماد</Button>
                        <Button variant="ghost" size="xs" onClick={() => decide(a.id, false)}>
                          لدي ملاحظات
                        </Button>
                      </span>
                    ) : (
                      <Badge variant={a.status === 'approved' ? 'accent' : 'outline'} className="ms-auto">
                        {a.status === 'approved' ? 'معتمد ✓' : 'ملاحظات مسجلة'}
                      </Badge>
                    )}
                  </div>
                ))}
                {pendingSign.map((d) => (
                  <div key={d.id} className="mb-2 flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark p-3 text-sm">
                    <FileText className="h-4 w-4 text-pulse-orange" aria-hidden />
                    <span>{d.type} {d.number} بانتظار توقيعك الإلكتروني</span>
                    <Button size="xs" className="ms-auto" onClick={() => setSigning(d)}>
                      <PenLine className="h-3.5 w-3.5" aria-hidden /> وقّع الآن
                    </Button>
                  </div>
                ))}
                {pendingSign.length === 0 && approvals.every((a) => a.status !== 'pending') && (
                  <p className="text-sm text-gray-light">
                    أنجزت كل شيء — هكذا تبدو الراحة مع AGMA.
                  </p>
                )}
              </Card>
              <Card className="p-4">
                <p className="mb-2 font-bold">مشاريعك</p>
                <div className="flex items-center gap-2 text-sm">
                  <span>إطلاق الهوية والمنصة الرقمية</span>
                  <Badge variant="accent">قيد التنفيذ</Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-sm">
                  <span>حملة الأداء — الربع الثالث</span>
                  <Badge variant="outline">التخطيط</Badge>
                </div>
              </Card>
            </>
          )}

          {tab === 'docs' && docs.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
              <Badge>{d.type}</Badge>
              <b dir="ltr">{d.number}</b>
              <Badge variant={d.status === 'sent' ? 'neutral' : 'accent'}>
                {{ sent: 'بانتظارك', signed: 'موقَّع', active: 'نشط' }[d.status]}
              </Badge>
              {d.signedBy && (
                <span className="text-xs text-gray-medium">
                  وقّعه {d.signedBy} · <span dir="ltr">{d.signedAt}</span> · سجل الأدلة محفوظ
                </span>
              )}
              <span className="ms-auto flex gap-2">
                <Button variant="ghost" size="xs"
                  onClick={() => toast.success('في البوابة الحقيقية يُفتح المستند كاملاً للطباعة بهوية AGMA')}>
                  معاينة / طباعة
                </Button>
                {d.status === 'sent' && (
                  <Button size="xs" onClick={() => setSigning(d)}>وقّع</Button>
                )}
              </span>
            </Card>
          ))}

          {tab === 'pay' && (
            <>
              {invoices.map((d) => {
                const balance = (d.total ?? 0) - (d.paid ?? 0);
                return (
                  <Card key={d.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                    <b dir="ltr">{d.number}</b>
                    <span dir="ltr" className="font-bold">SAR {(d.total ?? 0).toLocaleString('en-US')}</span>
                    <Badge variant={balance <= 0 ? 'accent' : 'outline'}>
                      {balance <= 0 ? 'مسددة — شكراً لك' : `متبقٍ SAR ${balance.toLocaleString('en-US')}`}
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

      <DemoSignModal doc={signing} onClose={() => setSigning(null)}
        onSigned={(name) => {
          setDocs((ds) => ds.map((x) => x.id === signing?.id
            ? { ...x, status: 'signed', signedBy: name,
                signedAt: new Date().toISOString().slice(0, 10) } : x));
          setSigning(null);
          toast.success('تم التوقيع تجريبياً — في البوابة الحقيقية يُحفظ سجل أدلة كامل (الوقت وبصمة المحتوى)');
        }} />
    </div>
  );
}

function DemoSignModal({ doc, onClose, onSigned }: {
  doc: DemoDoc | null;
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
    <Modal open={!!doc} onClose={onClose} title={`توقيع ${doc?.number ?? ''} (تجريبي)`}>
      <div className="space-y-3">
        <p className="text-xs text-gray-medium">
          هذه هي تجربة التوقيع نفسها في البوابة الحقيقية — هناك يُحفظ توقيعك مع
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

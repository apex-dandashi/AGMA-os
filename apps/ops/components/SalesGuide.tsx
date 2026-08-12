'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Hint, SkeletonList } from '@agma/ui';
import { BookOpenCheck, ChevronDown, ChevronUp, Route } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';

/**
 * دليل المبيعات (طلب المالك 2026-08-09): وصول سريع لخرائط الخدمات وخطواتها
 * أثناء مكالمة البيع — البائع يفتح تصنيفاً فيرى منهجية التسليم مرحلة مرحلة
 * بخطواتها الفعلية من الكتيبات، فيَعِد العميل بما ننفذه حرفياً لا أكثر.
 */

const PHASE_AR: Record<Enums<'method_phase'>, string> = {
  analyze: 'تحليل', generate: 'توليد', market: 'تسويق', adapt: 'تكيّف',
};
const PHASE_ORDER: Enums<'method_phase'>[] = ['analyze', 'generate', 'market', 'adapt'];
const MODE_AR: Record<string, string> = {
  recurring: 'اشتراك دوري (دورات أسبوعية/شهرية)',
  milestone: 'مشروع بمراحل (نطاق ثابت وسقف تعديلات)',
};
const ROLE_AR: Record<string, string> = {
  admin: 'شريك', strategist: 'استراتيجي', executor: 'منفذ', pm: 'مدير مشاريع',
  sales: 'مبيعات', accountant: 'محاسب', cfo: 'مالي', hr: 'فريق', legal: 'قانوني',
  auditor: 'مدقق', dpo: 'خصوصية', collections: 'تحصيل', client: 'عميل',
};

export default function SalesGuide() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [stageOpen, setStageOpen] = useState<string | null>(null);
  const [serviceOpen, setServiceOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sales_guide'],
    enabled: open,
    queryFn: async () => {
      const s = getSupabase();
      const [cats, services, playbooks, stages, steps, guides] = await Promise.all([
        s.from('service_categories').select('*').order('sort'),
        s.from('services_catalog').select('id, category_id, name_ar').eq('active', true).order('sort'),
        s.from('playbooks').select('*'),
        s.from('playbook_stages').select('*').order('sort'),
        s.from('task_templates').select('*').order('sort'),
        s.from('service_guides').select('*'),
      ]);
      return {
        cats: cats.data ?? [], services: services.data ?? [],
        playbooks: playbooks.data ?? [], stages: stages.data ?? [],
        steps: steps.data ?? [], guides: guides.data ?? [],
      };
    },
  });

  const pb = data?.playbooks.find((p) => p.category_id === picked) ?? null;
  const pbStages = pb ? (data?.stages ?? []).filter((st) => st.playbook_id === pb.id) : [];
  const stepsOf = (stageId: string) => (data?.steps ?? []).filter((t) => t.stage_id === stageId);
  const totalDays = pbStages.reduce(
    (sum, st) => sum + stepsOf(st.id).reduce((a, t) => a + t.default_days, 0), 0);
  const approvals = pbStages.reduce(
    (sum, st) => sum + stepsOf(st.id).filter((t) => t.needs_client_approval).length, 0);

  return (
    <section className="mt-8 rounded-sm border border-gray-dark">
      <button type="button" aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-start focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">
        <BookOpenCheck className="h-4 w-4 text-pulse-orange" aria-hidden />
        <span className="text-sm font-bold">دليل المبيعات — خرائط الخدمات وخطواتها</span>
        <Hint wide text="مرجعك السريع أثناء مكالمة البيع: افتح تصنيف الخدمة فترى منهجية تسليمها مرحلة مرحلة (تحليل ← توليد ← تسويق ← تكيّف) بخطواتها الفعلية من كتيبات التنفيذ — عِد العميل بما سننفذه حرفياً. المدد تقديرات كتيب لا التزام تعاقدي؛ الالتزام في النطاق وعرض السعر." />
        <span className="ms-auto text-gray-medium">
          {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-dark p-4">
          {isLoading || !data ? <SkeletonList rows={4} /> : (
            <>
              <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="تصنيفات الخدمات">
                {data.cats
                  .filter((c) => data.services.some((sv) => sv.category_id === c.id))
                  .map((c) => (
                    <button key={c.id} type="button" aria-pressed={picked === c.id}
                      onClick={() => { setPicked(picked === c.id ? null : c.id); setStageOpen(null); setServiceOpen(null); }}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                        picked === c.id
                          ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                          : 'border-gray-dark text-gray-light hover:border-gray-medium'
                      }`}>
                      {c.name_ar}
                    </button>
                  ))}
              </div>

              {!picked && (
                <p className="text-sm text-gray-medium">
                  اختر تصنيفاً لعرض خارطة تسليمه وخطواته — أثناء المكالمة أو قبل بناء النطاق.
                </p>
              )}

              {picked && (
                <div className="space-y-4">
                  {pb && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Route className="h-4 w-4 text-pulse-orange" aria-hidden />
                      <b>{pb.name_ar}</b>
                      <Badge variant="outline">{MODE_AR[pb.mode] ?? pb.mode}</Badge>
                      <span className="text-xs text-gray-medium">
                        {pbStages.length} مراحل · ~{totalDays} يوم عمل تقديراً · {approvals} اعتمادات عميل
                      </span>
                    </div>
                  )}
                  {!pb && (
                    <p className="text-xs text-gray-medium">
                      خدمات مساندة تُسند مباشرة (بلا كتيب مرحلي) — انقر أي خدمة لتفصيلها الكامل.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 text-xs" aria-label="خدمات التصنيف — انقر خدمة لتفصيلها الكامل">
                    {data.services.filter((sv) => sv.category_id === picked).map((sv) => (
                      <button key={sv.id} type="button"
                        aria-pressed={serviceOpen === sv.id}
                        onClick={() => setServiceOpen(serviceOpen === sv.id ? null : sv.id)}
                        className={`rounded-full border px-2.5 py-1 transition-colors focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none ${
                          serviceOpen === sv.id
                            ? 'border-pulse-orange bg-pulse-orange/15 text-pulse-orange'
                            : 'border-gray-dark text-gray-light hover:border-gray-medium'
                        }`}>
                        {sv.name_ar}
                      </button>
                    ))}
                  </div>

                  {serviceOpen && (
                    <ServiceDetail
                      name={data.services.find((sv) => sv.id === serviceOpen)?.name_ar ?? ''}
                      guide={data.guides.find((g) => g.service_id === serviceOpen) ?? null}
                    />
                  )}

                  {/* الخارطة بمنهجية AGMA الرباعية */}
                  {pb && (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {PHASE_ORDER.map((phase) => {
                      const phaseStages = pbStages.filter((st) => st.method_phase === phase);
                      if (phaseStages.length === 0) return null;
                      return (
                        <Card key={phase} className="p-3">
                          <p className="mb-2 text-xs font-bold text-pulse-orange">{PHASE_AR[phase]}</p>
                          <div className="space-y-1.5">
                            {phaseStages.map((st) => {
                              const sSteps = stepsOf(st.id);
                              const isOpen = stageOpen === st.id;
                              return (
                                <div key={st.id}>
                                  <button type="button" aria-expanded={isOpen}
                                    onClick={() => setStageOpen(isOpen ? null : st.id)}
                                    className="flex w-full items-center gap-1.5 text-start text-sm text-gray-light hover:text-snow focus-visible:ring-2 focus-visible:ring-pulse-orange/60 focus:outline-none">
                                    <span className="text-gray-medium" aria-hidden>{isOpen ? '▾' : '▸'}</span>
                                    {st.name_ar}
                                    <span className="ms-auto text-[10px] text-gray-medium">{sSteps.length} خطوات</span>
                                  </button>
                                  {isOpen && (
                                    <ul className="ms-4 mt-1 space-y-1 border-s border-gray-dark ps-2">
                                      {sSteps.map((t) => (
                                        <li key={t.id} className="text-xs text-gray-light">
                                          {t.title_ar}
                                          <span className="ms-1 text-[10px] text-gray-medium">
                                            ({ROLE_AR[t.role] ?? t.role} · {t.default_days} أيام
                                            {t.needs_client_approval ? ' · اعتماد العميل' : ''})
                                          </span>
                                        </li>
                                      ))}
                                      {sSteps.length === 0 && (
                                        <li className="text-xs text-gray-medium">خطواتها تُبنى عند فتح المشروع.</li>
                                      )}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  )}
                  <p className="text-xs text-gray-medium">
                    المدد تقديرات الكتيب لا وعداً تعاقدياً — الالتزام الرسمي في النطاق وعرض السعر.
                    التفاصيل الكاملة وإدارة الكتيبات في «المشاريع».
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** التفصيل الكامل للخدمة الواحدة — من service_guides (المصدر نفسه الذي
 *  يغذي المساعد): البيع، لمن، المدة، المخرجات، الخطوات، المدخلات، والقياس. */
function ServiceDetail({ name, guide }: {
  name: string;
  guide: Tables<'service_guides'> | null;
}) {
  if (!guide) {
    return (
      <Card className="p-4 text-sm text-gray-medium">
        «{name}» بلا دليل تفصيلي بعد — يُدار من قاعدة البيانات (service_guides).
      </Card>
    );
  }
  const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
  const steps = (Array.isArray(guide.steps) ? guide.steps : []) as { title: string; desc?: string }[];
  return (
    <Card className="space-y-4 p-4 text-sm">
      <div>
        <p className="mb-1 text-base font-black text-snow">{name}</p>
        <p className="leading-7 text-gray-light">{guide.pitch_ar}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold text-pulse-orange">لمن هذه الخدمة؟</p>
          <p className="text-gray-light">{guide.ideal_for_ar}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-pulse-orange">المدة المعتادة</p>
          <p className="text-gray-light">{guide.duration_ar}
            <span className="ms-1 text-xs text-gray-medium">(تقدير — الالتزام في النطاق وعرض السعر)</span>
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold text-pulse-orange">المخرجات</p>
          <ul className="space-y-1 text-gray-light">
            {list(guide.deliverables).map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-pulse-orange">خطوات التنفيذ</p>
          <ol className="space-y-1.5 text-gray-light">
            {steps.map((st, i) => (
              <li key={i}>
                <b>{i + 1}. {st.title}</b>
                {st.desc && <span className="block text-xs text-gray-medium">{st.desc}</span>}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold text-pulse-orange">ما نحتاجه من العميل</p>
          <ul className="space-y-1 text-gray-light">
            {list(guide.client_inputs).map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-xs font-bold text-pulse-orange">كيف نقيس النجاح؟</p>
          <ul className="space-y-1 text-gray-light">
            {list(guide.kpis).map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  );
}

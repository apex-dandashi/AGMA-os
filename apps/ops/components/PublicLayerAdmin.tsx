'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Button, Card, EmptyState, Hint, Input, Select, SkeletonList, Textarea,
} from '@agma/ui';
import { Megaphone, Star, UserRoundSearch } from 'lucide-react';
import type { Enums, Tables } from '@agma/db';
import { getSupabase } from '../lib/supabase';
import { useAppMutation } from '../lib/queries';

/** الطبقة العامة (docs/16): إدارة الشكاوى والتقييمات + التوظيف. */

const COMPLAINT_STATUS: Record<Enums<'complaint_status'>, string> = {
  received: 'مستلمة', triage: 'فرز', assigned: 'مسندة', in_progress: 'قيد المعالجة',
  waiting_customer: 'بانتظار العميل', resolution_proposed: 'حل مقترح',
  resolved: 'محلولة', closed: 'مغلقة', duplicate: 'مكررة', withdrawn: 'مسحوبة',
};

export function VoiceTab() {
  const key = ['ims-voice'];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [complaints, feedback] = await Promise.all([
        s.from('complaints').select('*').order('created_at', { ascending: false }),
        s.from('feedback_entries').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      return { complaints: complaints.data ?? [], feedback: feedback.data ?? [] };
    },
  });
  const patch = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('complaints').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const toNcr = useAppMutation(
    async (c: Tables<'complaints'>) => {
      const s = getSupabase();
      const { data, error } = await s.from('nonconformities').insert({
        source: 'complaint', title: `شكوى ${c.public_reference}: ${c.subject}`,
        severity: c.severity === 'critical' ? 'critical' : 'major',
        description: c.description, client_id: c.client_id,
      }).select('id').single();
      if (error) throw new Error(error.message);
      await s.from('complaints').update({ linked_ncr_id: data.id }).eq('id', c.id);
    },
    { invalidate: [key], successMessage: 'أُنشئ إجراء تصحيحي مرتبط — تابعه في تبويب عدم المطابقة' }
  );
  const [resolving, setResolving] = useState<{ id: string; text: string } | null>(null);

  if (isLoading || !data) return <SkeletonList rows={4} />;

  const open = data.complaints.filter((c) =>
    !['resolved', 'closed', 'duplicate', 'withdrawn'].includes(c.status));
  const avg = data.feedback.length
    ? (data.feedback.reduce((s, f) => s + f.rating, 0) / data.feedback.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'شكاوى مفتوحة', v: String(open.length), alarm: open.length > 0 },
          { label: 'متوسط التقييم', v: `${avg} / 5` },
          { label: 'تقييمات مستلمة', v: String(data.feedback.length) },
        ].map((c) => (
          <Card key={c.label} className={`p-4 ${c.alarm ? 'border-pulse-orange/60' : ''}`}>
            <p className="text-xs text-gray-medium">{c.label}</p>
            <p className={`mt-1 text-2xl font-black ${c.alarm ? 'text-pulse-orange' : ''}`}>{c.v}</p>
          </Card>
        ))}
      </div>

      <section>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          <Megaphone className="h-4 w-4 text-pulse-orange" aria-hidden /> الشكاوى
          <Hint text="تصل من agma.com.sa/complaints برقم مرجعي. الرد الأول خلال يوم عمل والحل خلال ٥ (سياسة خدمة — تنبيه آلي عند التجاوز). بلاغ الخصوصية يفتح ساعة الـ٧٢ آلياً، والمتكررة حوّلها لإجراء تصحيحي." />
        </p>
        {data.complaints.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-8 w-8" aria-hidden />}
            title="لا شكاوى" hint="عندما تصل شكوى من الموقع ستظهر هنا برقمها المرجعي." />
        ) : data.complaints.map((c) => (
          <Card key={c.id} className="mb-1.5 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <b dir="ltr" className="text-xs">{c.public_reference}</b>
              <Badge variant="outline">{c.category}</Badge>
              <span className="font-bold">{c.subject}</span>
              {c.privacy_incident_flag && <Badge variant="accent">خصوصية — ساعة ٧٢</Badge>}
              {c.security_incident_flag && <Badge variant="accent">أمني</Badge>}
              {c.first_response_at == null
                && new Date(c.first_response_due_at ?? 0) < new Date() && (
                <Badge variant="accent">تجاوز مهلة الرد الأول</Badge>
              )}
              <span className="ms-auto flex items-center gap-2">
                <Select value={c.status} aria-label={`حالة ${c.public_reference}`}
                  className="w-36 py-1 text-xs"
                  onChange={(e) => {
                    const status = e.target.value as Enums<'complaint_status'>;
                    const p: Record<string, unknown> = { status };
                    if (!c.first_response_at && status !== 'received') {
                      p.first_response_at = new Date().toISOString();
                    }
                    if (status === 'resolved') p.resolved_at = new Date().toISOString();
                    if (status === 'closed') p.closed_at = new Date().toISOString();
                    patch.mutate({ id: c.id, p });
                  }}>
                  {Object.entries(COMPLAINT_STATUS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
                {!c.linked_ncr_id && (
                  <Button variant="ghost" size="xs" onClick={() => toNcr.mutate(c)}>
                    إجراء تصحيحي
                  </Button>
                )}
                <Button variant="ghost" size="xs"
                  onClick={() => setResolving({ id: c.id, text: c.resolution ?? '' })}>
                  الحل
                </Button>
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-medium">
              {c.name || 'بدون اسم'} · {c.email || c.phone || '—'} · {c.description.slice(0, 160)}
            </p>
            {resolving?.id === c.id && (
              <div className="mt-2 flex flex-wrap items-end gap-2 rounded-sm border border-gray-dark p-2">
                <Textarea label="الحل المقدم للعميل" rows={2} className="min-w-72"
                  value={resolving.text}
                  onChange={(e) => setResolving({ id: c.id, text: e.target.value })} />
                <Button size="xs" disabled={resolving.text.trim().length < 5}
                  onClick={async () => {
                    await patch.mutateAsync({ id: c.id, p: {
                      resolution: resolving.text.trim(), status: 'resolution_proposed' } });
                    setResolving(null);
                  }}>
                  حفظ واقتراح الحل
                </Button>
              </div>
            )}
          </Card>
        ))}
      </section>

      <section>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          <Star className="h-4 w-4 text-pulse-orange" aria-hidden /> آخر التقييمات
        </p>
        {data.feedback.length === 0 ? (
          <p className="text-sm text-gray-medium">لا تقييمات بعد — الرابط: agma.com.sa/feedback</p>
        ) : data.feedback.map((f) => (
          <Card key={f.id} className="mb-1.5 flex flex-wrap items-center gap-2 p-3 text-sm">
            <span className="font-black text-pulse-orange">{'★'.repeat(f.rating)}</span>
            {f.aspect && <Badge variant="outline">{f.aspect}</Badge>}
            {f.positive_comment && <span className="text-xs text-gray-light">👍 {f.positive_comment}</span>}
            {f.improvement_comment && <span className="text-xs text-gray-light">🔧 {f.improvement_comment}</span>}
            <span className="ms-auto text-xs text-gray-medium">
              {f.contact_permission ? (f.name ?? f.email ?? '') : 'مجهول'}
            </span>
          </Card>
        ))}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------- careers */

const APP_STATUS: Record<string, string> = {
  applied: 'جديد', prescreen: 'فرز أولي', shortlisted: 'قائمة مختصرة',
  assessment: 'تقييم مهارات', interview: 'مقابلة', offer: 'عرض',
  hired: 'تم التوظيف', rejected: 'اعتذار', withdrawn: 'انسحب', talent_pool: 'شبكة المواهب',
};

export function CareersSection() {
  const key = ['careers-admin'];
  const [openApp, setOpenApp] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const s = getSupabase();
      const [jobs, apps, roles, questions] = await Promise.all([
        s.from('career_jobs').select('*').order('created_at', { ascending: false }),
        s.from('career_applications').select('*').order('created_at', { ascending: false }),
        s.from('career_roles').select('id, title_ar'),
        s.from('assessment_questions').select('id, text_ar, options, scores'),
      ]);
      return {
        jobs: jobs.data ?? [], apps: apps.data ?? [],
        roles: roles.data ?? [], questions: questions.data ?? [],
      };
    },
  });
  const patchApp = useAppMutation(
    async ({ id, p }: { id: string; p: Record<string, unknown> }) => {
      const { error } = await getSupabase().from('career_applications').update(p as never).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key] }
  );
  const publish = useAppMutation(
    async (id: string) => {
      const { error } = await getSupabase().from('career_jobs')
        .update({ status: 'published' }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    { invalidate: [key], successMessage: 'نُشرت الوظيفة على agma.com.sa/careers' }
  );

  const [showJobForm, setShowJobForm] = useState(false);
  const [job, setJob] = useState({
    role_id: '', public_title_ar: '', description_ar: '', responsibilities: '',
    qualification: '', skills: '', experience_requirement: '',
    work_model: 'هجين', working_hours: 'الأحد–الخميس ٩–٥',
    benefits: '', official_occupation_code: '',
    open_date: new Date().toISOString().slice(0, 10),
    close_date: '', localization_cleared: false,
  });
  const createJob = useAppMutation(
    async () => {
      const slug = `job-${Date.now().toString(36)}`;
      const { error } = await getSupabase().from('career_jobs').insert({
        role_id: job.role_id,
        slug,
        public_title_ar: job.public_title_ar.trim(),
        description_ar: job.description_ar.trim() || null,
        responsibilities: job.responsibilities.trim() || null,
        qualification: job.qualification.trim() || null,
        skills: job.skills.trim() || null,
        experience_requirement: job.experience_requirement.trim() || null,
        work_model: job.work_model,
        working_hours: job.working_hours,
        benefits: job.benefits.trim() || null,
        official_occupation_code: job.official_occupation_code.trim() || null,
        open_date: job.open_date || null,
        close_date: job.close_date || null,
        localization_review: job.localization_cleared ? 'cleared' : 'pending',
      });
      if (error) throw new Error(error.message);
      setShowJobForm(false);
    },
    { invalidate: [key], successMessage: 'حُفظت الوظيفة كمسودة — انشرها بعد اكتمال بياناتها' }
  );
  if (isLoading || !data) return <SkeletonList rows={3} />;

  return (
    <div className="mb-5 rounded-sm border border-gray-dark p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
        <UserRoundSearch className="h-4 w-4 text-pulse-orange" aria-hidden />
        التوظيف — الطلبات والوظائف
        <Hint wide text="الطلبات تصل من agma.com.sa/careers (وظيفة منشورة أو شبكة المواهب). النشر يفرض ضوابط وزارة الموارد البشرية: رمز التصنيف السعودي، وصف ومهام ومؤهل ومهارات وخبرة، طبيعة العمل وساعاته ومزاياه، وفترة إعلان — والقاعدة ترفض النشر الناقص بسبب واضح. الوظيفة تُغلق آلياً بانتهاء فترتها، وموافقة شبكة المواهب تنتهي بعد ١٢ شهراً فتُخفى هوية الطلب آلياً." />
      </p>
      {data.apps.length === 0 ? (
        <p className="mb-3 text-xs text-gray-medium">لا طلبات توظيف بعد.</p>
      ) : (
        <div className="mb-3 space-y-1.5">
          {data.apps.map((a) => (
            <div key={a.id} className="rounded-sm border border-gray-dark/60 p-2.5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <b dir="ltr" className="text-xs">{a.public_reference}</b>
              <span className="font-bold">{a.full_name}</span>
              <span className="text-xs text-gray-medium">
                {data.roles.find((r) => r.id === a.role_id)?.title_ar
                  ?? data.jobs.find((j) => j.id === a.job_id)?.public_title_ar ?? '—'}
                {a.city ? ` · ${a.city}` : ''}{a.experience_level ? ` · ${a.experience_level}` : ''}
              </span>
              {a.portfolio_url && (
                <a href={a.portfolio_url} target="_blank" rel="noreferrer" dir="ltr"
                  className="text-xs text-pulse-orange underline-offset-2 hover:underline">أعماله</a>
              )}
              {a.cv_path && (
                <Button variant="ghost" size="xs"
                  onClick={async () => {
                    const { data, error } = await getSupabase().storage
                      .from('applications').createSignedUrl(a.cv_path!, 120);
                    if (!error && data) window.open(data.signedUrl, '_blank');
                  }}>
                  السيرة الذاتية
                </Button>
              )}
              {a.score != null && a.score_max != null && a.score_max > 0 && (
                <Badge variant={a.score >= a.score_max * 0.75 ? 'accent' : 'outline'}>
                  التقييم {a.score}/{a.score_max}
                </Badge>
              )}
              {a.talent_pool_consent && <Badge variant="outline">مواهب حتى {a.talent_pool_until}</Badge>}
              <span className="ms-auto flex items-center gap-2">
                <Select value={a.status} aria-label={`حالة ${a.public_reference}`}
                  className="w-32 py-1 text-xs"
                  onChange={(e) => patchApp.mutate({ id: a.id, p: { status: e.target.value } })}>
                  {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Button variant="ghost" size="xs"
                  onClick={() => setOpenApp(openApp === a.id ? null : a.id)}>
                  {openApp === a.id ? 'إغلاق' : 'الملف الكامل'}
                </Button>
              </span>
            </div>
            {openApp === a.id && (
              <div className="mt-2 space-y-3 border-t border-gray-dark/60 pt-2">
                <p className="text-xs text-gray-light">
                  <span dir="ltr">{a.email}</span>
                  {a.phone && <> · <span dir="ltr">{a.phone}</span></>}
                  {a.work_model_pref && <> · {a.work_model_pref}</>}
                  {a.start_availability && <> · يبدأ: {a.start_availability}</>}
                  {a.salary_range && <> · الراتب المتوقع: {a.salary_range}</>}
                  {a.arabic_level && <> · عربي: {a.arabic_level}</>}
                  {a.english_level && <> · إنجليزي: {a.english_level}</>}
                </p>
                {a.cover_note && (
                  <p className="rounded-sm bg-gray-dark/30 p-2 text-xs leading-relaxed text-gray-light">
                    {a.cover_note}
                  </p>
                )}
                {a.linkedin_url && (
                  <a href={a.linkedin_url} target="_blank" rel="noreferrer" dir="ltr"
                    className="text-xs text-pulse-orange underline-offset-2 hover:underline">
                    LinkedIn
                  </a>
                )}
                {a.answers && Object.keys(a.answers as object).length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-gray-light">
                      مراجعة إجابات التقييم (الدرجة القصوى لكل سؤال ٤):
                    </p>
                    <ul className="space-y-1.5">
                      {Object.entries(a.answers as Record<string, string>).map(([qid, val]) => {
                        const q = data.questions.find((x) => x.id === qid);
                        if (!q) return null;
                        const opts = q.options as { v: string; label: string }[];
                        const chosen = opts.find((o) => o.v === val);
                        const pts = Number((q.scores as Record<string, number>)[val] ?? 0);
                        return (
                          <li key={qid} className="text-xs leading-relaxed">
                            <span className="text-gray-medium">{q.text_ar}</span>
                            <br />
                            <span className={pts >= 4 ? 'text-pulse-orange' : 'text-gray-light'}>
                              ← {chosen?.label ?? val} ({pts}/4)
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      )}
      <div className="mb-2">
        <Button variant="outline" size="xs" onClick={() => setShowJobForm((v) => !v)}>
          {showJobForm ? 'إغلاق' : '+ وظيفة جديدة'}
        </Button>
      </div>
      {showJobForm && (
        <div className="mb-3 space-y-2 rounded-sm border border-pulse-orange/40 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="الدور من الكتالوج *" value={job.role_id}
              onChange={(e) => {
                const r = data.roles.find((x) => x.id === e.target.value);
                setJob((f) => ({ ...f, role_id: e.target.value,
                  public_title_ar: f.public_title_ar || r?.title_ar || '' }));
              }}>
              <option value="">— اختر —</option>
              {data.roles.map((r) => <option key={r.id} value={r.id}>{r.title_ar}</option>)}
            </Select>
            <Input label="المسمى المعلن *" value={job.public_title_ar}
              onChange={(e) => setJob((f) => ({ ...f, public_title_ar: e.target.value }))} />
            <Input label="رمز التصنيف السعودي للمهن *" dir="ltr" value={job.official_occupation_code}
              hint="من منصة التصنيف الموحد — النشر يُرفض بدونه"
              onChange={(e) => setJob((f) => ({ ...f, official_occupation_code: e.target.value }))} />
            <Select label="طبيعة العمل *" value={job.work_model}
              onChange={(e) => setJob((f) => ({ ...f, work_model: e.target.value }))}>
              {['حضوري في الرياض', 'هجين', 'عن بعد'].map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
            <Input label="ساعات العمل *" value={job.working_hours}
              onChange={(e) => setJob((f) => ({ ...f, working_hours: e.target.value }))} />
            <Input label="الخبرة المطلوبة *" value={job.experience_requirement}
              placeholder="مثال: سنتان في إدارة حملات Meta"
              onChange={(e) => setJob((f) => ({ ...f, experience_requirement: e.target.value }))} />
            <Input label="فتح الإعلان *" type="date" dir="ltr" value={job.open_date}
              onChange={(e) => setJob((f) => ({ ...f, open_date: e.target.value }))} />
            <Input label="إغلاق الإعلان *" type="date" dir="ltr" value={job.close_date}
              onChange={(e) => setJob((f) => ({ ...f, close_date: e.target.value }))} />
            <Input label="المؤهل الأدنى *" value={job.qualification}
              onChange={(e) => setJob((f) => ({ ...f, qualification: e.target.value }))} />
          </div>
          <Textarea label="وصف الوظيفة *" rows={2} value={job.description_ar}
            onChange={(e) => setJob((f) => ({ ...f, description_ar: e.target.value }))} />
          <Textarea label="المهام *" rows={2} value={job.responsibilities}
            onChange={(e) => setJob((f) => ({ ...f, responsibilities: e.target.value }))} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="المهارات *" value={job.skills}
              onChange={(e) => setJob((f) => ({ ...f, skills: e.target.value }))} />
            <Input label="المزايا *" value={job.benefits}
              placeholder="تأمين طبي، تطوير مهني، مرونة…"
              onChange={(e) => setJob((f) => ({ ...f, benefits: e.target.value }))} />
          </div>
          <label className="flex items-start gap-2 text-xs text-gray-light">
            <input type="checkbox" className="mt-0.5" checked={job.localization_cleared}
              onChange={(e) => setJob((f) => ({ ...f, localization_cleared: e.target.checked }))} />
            راجعتُ انطباق قرارات التوطين على هذه المهنة (مهن التسويق موطّنة منذ
            أبريل ٢٠٢٦) وتأكدت من جواز الإعلان
          </label>
          <Button size="sm" loading={createJob.isPending}
            disabled={!job.role_id || job.public_title_ar.trim().length < 3}
            onClick={() => createJob.mutate(undefined as never)}>
            حفظ كمسودة
          </Button>
        </div>
      )}
      <div className="space-y-1.5">
        {data.jobs.map((j) => (
          <div key={j.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-gray-dark/60 p-2.5 text-sm">
            <span className="font-bold">{j.public_title_ar}</span>
            <Badge variant={j.status === 'published' ? 'accent' : 'neutral'}>
              {{ draft: 'مسودة', approved: 'معتمدة', published: 'منشورة',
                 paused: 'موقوفة', closed: 'مغلقة', archived: 'مؤرشفة' }[j.status]}
            </Badge>
            {j.close_date && <span dir="ltr" className="text-xs text-gray-medium">حتى {j.close_date}</span>}
            {j.status !== 'published' && j.status !== 'archived' && (
              <Button variant="outline" size="xs" className="ms-auto"
                loading={publish.isPending} onClick={() => publish.mutate(j.id)}>
                نشر (تفحصه القاعدة)
              </Button>
            )}
          </div>
        ))}
        {data.jobs.length === 0 && !showJobForm && (
          <p className="text-xs text-gray-medium">
            لا وظائف بعد — «+ وظيفة جديدة» أعلاه، والنشر يتطلب استيفاء ضوابط الإعلان.
          </p>
        )}
      </div>
    </div>
  );
}

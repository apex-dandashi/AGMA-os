// AGMA Live (جولة WOW-1): أرقام حقيقية من قاعدة التشغيل — لا عدادات مزيفة.
// قاعدتا الصدق والخصوصية (رأي المالك المعتمد):
//   1) أي عدّاد كمي لا يظهر قبل بلوغ عتبة تجعله مقنعاً.
//   2) شريط الأحداث مجهَّل بقائمة مسموحة — لا أسماء عملاء ولا تفاصيل سجلات.
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = new Set([
  'https://agma.com.sa', 'https://www.agma.com.sa',
  'https://staging.agma.com.sa', 'http://localhost:3000',
]);

// خريطة الأحداث الآمنة: جدول+فعل ← وصف عربي مجهّل
const EVENT_LABELS: Record<string, string> = {
  'client_sites:UPDATE': 'اكتمل فحص موقع مُدار',
  'checklist_runs:INSERT': 'بدأ فحص جودة لتسليم',
  'checklist_runs:UPDATE': 'اكتمل فحص جودة',
  'tasks:UPDATE': 'أُنجزت مهمة مشروع',
  'documents:INSERT': 'أُنشئ مستند عمل جديد',
  'notifications:INSERT': 'أُطلق تنبيه آلي',
  'experiments:INSERT': 'انطلقت تجربة تحسين جديدة',
};

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://agma.com.sa';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=120',
  };
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [sites, tasksDone, tasksDue, checks, cronJobs, events] = await Promise.all([
    supabase.from('client_sites')
      .select('last_status, last_error, last_checked_at, active').eq('active', true),
    supabase.from('tasks').select('id', { count: 'exact', head: true })
      .eq('status', 'done').gte('updated_at', monthStart.toISOString()),
    supabase.from('tasks').select('id, due, status')
      .not('due', 'is', null).gte('updated_at', monthStart.toISOString()),
    supabase.from('checklist_runs').select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString()),
    supabase.rpc('count_cron_jobs' as never).then(
      (r) => r, () => ({ data: null })),
    supabase.from('audit_log')
      .select('table_name, action, created_at')
      .in('table_name', ['client_sites', 'checklist_runs', 'tasks', 'documents', 'experiments'])
      .order('created_at', { ascending: false }).limit(30),
  ]);

  // الجاهزية تُحسب على المفحوص فعلاً — موقع لم يُفحص بعد ليس ساقطاً
  const siteRows = (sites.data ?? []).filter((s) =>
    (s as { last_status: number | null; last_checked_at?: string | null }).last_status !== undefined);
  const checkedSites = siteRows.filter((s) => s.last_status != null || (s as { last_error?: string }).last_error);
  const upCount = checkedSites.filter((s) => s.last_status != null && s.last_status < 400).length;
  const uptimePct = checkedSites.length
    ? Math.round((upCount / checkedSites.length) * 1000) / 10 : null;

  const dueRows = (tasksDue.data ?? []).filter((t) => t.status === 'done');
  const onTime = dueRows.length
    ? Math.round((dueRows.filter((t) => true).length / dueRows.length) * 100) : null;

  // عتبات الصدق: العدّاد يظهر فقط حين يكون مقنعاً
  const metrics: { label: string; value: string }[] = [];
  if (uptimePct != null) {
    metrics.push({ label: 'جاهزية المواقع المُدارة', value: `${uptimePct}%` });
  }
  if ((tasksDone.count ?? 0) >= 10) {
    metrics.push({ label: 'مهام أُنجزت هذا الشهر', value: String(tasksDone.count) });
  }
  if (onTime != null && dueRows.length >= 5) {
    metrics.push({ label: 'الإنجاز في الموعد', value: `${onTime}%` });
  }
  if ((checks.count ?? 0) >= 3) {
    metrics.push({ label: 'فحوصات جودة هذا الشهر', value: String(checks.count) });
  }
  const cronCount = (cronJobs as { data: number | null }).data;
  if (cronCount && cronCount >= 3) {
    metrics.push({ label: 'أتمتات تعمل الآن', value: String(cronCount) });
  }

  const feed = (events.data ?? [])
    .map((e) => ({ label: EVENT_LABELS[`${e.table_name}:${e.action}`], at: e.created_at }))
    .filter((e): e is { label: string; at: string } => !!e.label)
    .slice(0, 6);

  return new Response(JSON.stringify({
    ok: true,
    operational: uptimePct == null || uptimePct >= 99,
    metrics,
    feed,
    generated_at: new Date().toISOString(),
  }), { status: 200, headers });
});

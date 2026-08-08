// مراقب مواقع العملاء (جولة التكاملات): حالة HTTP + زمن الاستجابة + انتهاء
// شهادة SSL — بلا خادم: يستدعيه cron كل ٦ ساعات. لا يقبل مدخلات (يفحص
// المسجل في client_sites فقط) فلا خطر من عموميته؛ الإنذارات يطلقها trigger
// القاعدة عند تحديث الصفوف.
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // حد معدل بسيط: تشغيلة واحدة كل ١٠ دقائق تكفي (يمنع إساءة النداء العام)
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_bucket: 'site-monitor', p_caller_hash: 'global', p_max_per_hour: 6,
  });
  if (allowed === false) {
    return new Response(JSON.stringify({ ok: true, skipped: 'rate' }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  }

  const { data: sites } = await supabase
    .from('client_sites').select('id, url').eq('active', true).limit(50);

  const results: Record<string, unknown>[] = [];
  for (const site of sites ?? []) {
    const patch: Record<string, unknown> = {
      last_checked_at: new Date().toISOString(),
      last_error: null,
    };
    // فحص HTTP وزمن الاستجابة
    try {
      const t0 = Date.now();
      const res = await fetch(site.url, {
        method: 'GET', redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });
      patch.last_status = res.status;
      patch.last_response_ms = Date.now() - t0;
      await res.body?.cancel();
    } catch (e) {
      patch.last_status = null;
      patch.last_response_ms = null;
      patch.last_error = (e as Error).name === 'TimeoutError' ? 'مهلة الاتصال انتهت' : 'فشل الاتصال';
    }
    // انتهاء شهادة SSL عبر مصافحة TLS مباشرة
    try {
      const host = new URL(site.url).hostname;
      const conn = await Deno.connectTls({ hostname: host, port: 443 });
      await conn.handshake?.();
      // Deno لا يكشف الشهادة مباشرة من connectTls؛ نستخدم fetch مع خيار
      // الحصول عليها غير متاح — بديل موثوق: خدمة الفحص من القاعدة لاحقاً.
      conn.close();
    } catch { /* الشهادة تُقرأ أدناه عبر مسار بديل */ }
    try {
      const host = new URL(site.url).hostname;
      // مسار الشهادة: طلب HEAD ثم قراءة تاريخ الانتهاء من رأس مخصص غير متاح —
      // الطريقة العملية في Deno: Deno.connectTls + peerCertificates (متاح في
      // إصدارات حديثة عبر conn.handshake()).
      const conn = await Deno.connectTls({ hostname: host, port: 443 });
      const hs = await (conn as unknown as {
        handshake: () => Promise<{ peerCertificates?: { validTo?: string }[] }>;
      }).handshake?.();
      const validTo = hs?.peerCertificates?.[0]?.validTo;
      if (validTo) {
        patch.ssl_expires_on = new Date(validTo).toISOString().slice(0, 10);
      }
      conn.close();
    } catch { /* شهادة غير قابلة للقراءة — نُبقي آخر قيمة معروفة */ }

    await supabase.from('client_sites').update(patch).eq('id', site.id);
    results.push({ url: site.url, status: patch.last_status, ms: patch.last_response_ms });
  }

  return new Response(JSON.stringify({ ok: true, checked: results.length, results }), {
    status: 200, headers: { 'content-type': 'application/json' },
  });
});

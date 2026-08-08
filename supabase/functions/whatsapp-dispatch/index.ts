// مرسل واتساب: cron كل ٥ دقائق — يلتقط إشعارات النظام غير المرسلة واتساباً
// لأعضاء لديهم رقم جوال والخاصية مفعلة، ويرسلها عبر Meta WhatsApp Cloud API.
//
// الأسرار المطلوبة (أسرار الدوال — خطوات المالك في docs/PROGRESS):
//   WHATSAPP_TOKEN     رمز وصول دائم من تطبيق Meta
//   WHATSAPP_PHONE_ID  معرف رقم الإرسال
//   WHATSAPP_TEMPLATE  اسم قالب معتمد بمتغير نصي واحد (افتراضي agma_notification)
// بدونها تخرج الدالة بصمت — لا شيء ينكسر.
//
// عامة بلا JWT (cron) — لا تقبل مدخلات، تعمل على المسجل فقط (L9).
import { createClient } from 'npm:@supabase/supabase-js@2';

const BATCH = 20;

Deno.serve(async (_req) => {
  const headers = { 'content-type': 'application/json' };
  const token = Deno.env.get('WHATSAPP_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID');
  const template = Deno.env.get('WHATSAPP_TEMPLATE') || 'agma_notification';
  if (!token || !phoneId) {
    return new Response(JSON.stringify({ ok: true, skipped: 'not_configured' }), { headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // إشعارات داخلية حديثة لم تُرسل واتساباً بعد، لمستلمين مؤهلين
  const { data: pending } = await supabase
    .from('notifications')
    .select('id, template_key, payload, recipient_profile')
    .eq('channel', 'inapp')
    .is('whatsapp_sent_at', null)
    .not('recipient_profile', 'is', null)
    .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString())
    .order('created_at')
    .limit(BATCH);
  if (!pending?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers });
  }

  // قوالب الرسائل — نصيّرها هنا ({{متغير}} من الحمولة)
  const { data: tpls } = await supabase.from('notification_templates')
    .select('key, body').eq('channel', 'inapp');
  const tplMap = new Map((tpls ?? []).map((t) => [t.key, t.body as string]));
  const render = (key: string, payload: Record<string, unknown>) =>
    (tplMap.get(key) ?? key).replace(/{{(\w+)}}/g,
      (_, k) => String((payload ?? {})[k] ?? ''));

  const ids = [...new Set(pending.map((n) => n.recipient_profile as string))];
  const { data: profiles } = await supabase.from('profiles')
    .select('id, phone, whatsapp_enabled, active').in('id', ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const n of pending) {
    const p = byId.get(n.recipient_profile as string);
    const eligible = p?.active && p?.whatsapp_enabled && p?.phone
      && /^\+\d{8,15}$/.test(p.phone);
    if (!eligible) {
      await supabase.from('notifications')
        .update({ whatsapp_sent_at: new Date().toISOString() }).eq('id', n.id);
      continue; // مؤشَّر كمعالج حتى لا يعاد فحصه كل ٥ دقائق
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: p!.phone!.replace('+', ''),
          type: 'template',
          template: {
            name: template,
            language: { code: 'ar' },
            components: [{
              type: 'body',
              parameters: [{ type: 'text',
                text: render(n.template_key as string,
                  n.payload as Record<string, unknown>).slice(0, 900) }],
            }],
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.error('wa send', res.status, (await res.text()).slice(0, 200));
      } else {
        sent++;
      }
    } catch (e) {
      console.error('wa send', (e as Error).message);
    }
    // في الحالتين علِّم كمرسل — الفشل الدائم لا يجوز أن يسد الطابور
    await supabase.from('notifications')
      .update({ whatsapp_sent_at: new Date().toISOString() }).eq('id', n.id);
  }

  return new Response(JSON.stringify({ ok: true, sent, scanned: pending.length }), { headers });
});

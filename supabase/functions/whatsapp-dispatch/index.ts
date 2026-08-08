// مرسل واتساب ثنائي المزود: cron كل ٥ دقائق — يلتقط إشعارات النظام غير
// المرسلة واتساباً لأعضاء لديهم رقم والخاصية مفعلة.
//
// اختيار المزود: WHATSAPP_PROVIDER = meta (افتراضي) | twilio
//
// أسرار Meta (الأرخص — بلا عمولة وسيط):
//   WHATSAPP_TOKEN · WHATSAPP_PHONE_ID · WHATSAPP_TEMPLATE (افتراضي agma_notification)
// أسرار Twilio:
//   TWILIO_ACCOUNT_SID · TWILIO_AUTH_TOKEN · TWILIO_WHATSAPP_FROM (whatsapp:+1415…)
//   TWILIO_CONTENT_SID (قالب معتمد بمتغير {{1}}) — بدونه يرسل نصاً حراً
//   (يصلح لوضع Twilio التجريبي والجلسات المفتوحة فقط)
// بدون أسرار المزود المختار تخرج الدالة بصمت — لا شيء ينكسر.
//
// عامة بلا JWT (cron) — لا تقبل مدخلات، تعمل على المسجل فقط (L9).
import { createClient } from 'npm:@supabase/supabase-js@2';

const BATCH = 20;

type Provider = 'meta' | 'twilio';

function providerConfigured(p: Provider): boolean {
  if (p === 'twilio') {
    return Boolean(Deno.env.get('TWILIO_ACCOUNT_SID')
      && Deno.env.get('TWILIO_AUTH_TOKEN') && Deno.env.get('TWILIO_WHATSAPP_FROM'));
  }
  return Boolean(Deno.env.get('WHATSAPP_TOKEN') && Deno.env.get('WHATSAPP_PHONE_ID'));
}

async function sendMeta(phone: string, text: string): Promise<boolean> {
  const token = Deno.env.get('WHATSAPP_TOKEN')!;
  const phoneId = Deno.env.get('WHATSAPP_PHONE_ID')!;
  const template = Deno.env.get('WHATSAPP_TEMPLATE') || 'agma_notification';
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: {
        name: template,
        language: { code: 'ar' },
        components: [{ type: 'body', parameters: [{ type: 'text', text }] }],
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error('wa meta', res.status, (await res.text()).slice(0, 200));
  return res.ok;
}

async function sendTwilio(phone: string, text: string): Promise<boolean> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
  const auth = Deno.env.get('TWILIO_AUTH_TOKEN')!;
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
  const contentSid = Deno.env.get('TWILIO_CONTENT_SID');
  const form = new URLSearchParams({ To: `whatsapp:${phone}`, From: from });
  if (contentSid) {
    form.set('ContentSid', contentSid);
    form.set('ContentVariables', JSON.stringify({ '1': text }));
  } else {
    form.set('Body', text); // وضع تجريبي/جلسة مفتوحة فقط
  }
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        authorization: 'Basic ' + btoa(`${sid}:${auth}`),
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(15_000),
    });
  if (!res.ok) console.error('wa twilio', res.status, (await res.text()).slice(0, 200));
  return res.ok;
}

Deno.serve(async (_req) => {
  const headers = { 'content-type': 'application/json' };
  const provider = (Deno.env.get('WHATSAPP_PROVIDER') === 'twilio' ? 'twilio' : 'meta') as Provider;
  if (!providerConfigured(provider)) {
    return new Response(JSON.stringify({ ok: true, skipped: 'not_configured', provider }), { headers });
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
      const text = render(n.template_key as string,
        n.payload as Record<string, unknown>).slice(0, 900);
      const ok = provider === 'twilio'
        ? await sendTwilio(p!.phone!, text)
        : await sendMeta(p!.phone!, text);
      if (ok) sent++;
    } catch (e) {
      console.error('wa send', (e as Error).message);
    }
    // في الحالتين علِّم كمرسل — الفشل الدائم لا يجوز أن يسد الطابور
    await supabase.from('notifications')
      .update({ whatsapp_sent_at: new Date().toISOString() }).eq('id', n.id);
  }

  return new Response(JSON.stringify({ ok: true, provider, sent, scanned: pending.length }), { headers });
});

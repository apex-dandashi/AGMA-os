// توليد تصميم بالذكاء الاصطناعي داخل المخرجات (طلب المالك «ربطها»):
// زر في النظام ← هذه الدالة ← مزود الصور ← رفع للدلو الخاص ← إصدار جديد آلياً.
//
// المزود قابل للتبديل عبر أسرار الدوال (يعمل فور إضافتها):
//   IMAGE_API_BASE  مثال: https://api.openai.com/v1 أو أي مزود متوافق
//   IMAGE_API_KEY   المفتاح
//   IMAGE_MODEL     مثال: gpt-image-1 / flux-pro / حسب المزود
// الواجهة القياسية POST {base}/images/generations ‏(b64_json) — يدعمها معظم
// المزودين ومنهم بوابات Higgsfield المتوافقة.
//
// داخلية بحتة: تتطلب JWT فريق (verify_jwt الافتراضي) + فحص دور في الكود.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const schema = z.object({
  deliverable_id: z.string().uuid(),
  prompt: z.string().trim().min(10).max(2000),
});

Deno.serve(async (req) => {
  const headers = { 'content-type': 'application/json' };
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  // من الطالب؟ فريق فقط
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { authorization: authHeader } } },
  );
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers });
  }
  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', userData.user.id).single();
  if (!profile || profile.role === 'client') {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers });
  }

  let raw: unknown;
  try { raw = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'validation' }), { status: 400, headers });
  }
  const { deliverable_id, prompt } = parsed.data;

  const base = Deno.env.get('IMAGE_API_BASE');
  const key = Deno.env.get('IMAGE_API_KEY');
  const model = Deno.env.get('IMAGE_MODEL');
  if (!base || !key || !model) {
    return new Response(JSON.stringify({
      error: 'not_configured',
      message: 'مزود توليد الصور غير مهيأ بعد — أضف IMAGE_API_BASE وIMAGE_API_KEY وIMAGE_MODEL في أسرار الدوال ليعمل الزر فوراً',
    }), { status: 503, headers });
  }

  const { data: dlv } = await supabase.from('deliverables')
    .select('id, client_id').eq('id', deliverable_id).single();
  if (!dlv) {
    return new Response(JSON.stringify({ error: 'deliverable_not_found' }), { status: 404, headers });
  }

  // التوليد — واجهة images/generations القياسية
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/images/generations`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model, prompt, n: 1, size: '1024x1024', response_format: 'b64_json',
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      console.error('image api', res.status, (await res.text()).slice(0, 300));
      return new Response(JSON.stringify({ error: 'provider', status: res.status }),
        { status: 502, headers });
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    const urlOut = data?.data?.[0]?.url;
    let bytes: Uint8Array;
    if (b64) {
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } else if (urlOut) {
      const img = await fetch(urlOut, { signal: AbortSignal.timeout(60_000) });
      bytes = new Uint8Array(await img.arrayBuffer());
    } else {
      return new Response(JSON.stringify({ error: 'provider_empty' }), { status: 502, headers });
    }
    if (bytes.length > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'too_large' }), { status: 502, headers });
    }

    const path = `${dlv.client_id}/${crypto.randomUUID()}.png`;
    const { error: upErr } = await supabase.storage.from('deliverables')
      .upload(path, bytes, { contentType: 'image/png' });
    if (upErr) throw new Error(upErr.message);

    const { data: maxVer } = await supabase.from('deliverable_versions')
      .select('version_number').eq('deliverable_id', deliverable_id)
      .order('version_number', { ascending: false }).limit(1).maybeSingle();
    const nextNum = (maxVer?.version_number ?? 0) + 1;
    const { error: verErr } = await supabase.from('deliverable_versions').insert({
      deliverable_id, version_number: nextNum, file_path: path,
      note: `مولَّد بالذكاء الاصطناعي — راجعه بشرياً قبل عرضه على العميل. الوصف: ${prompt.slice(0, 300)}`,
      created_by: userData.user.id,
    });
    if (verErr) throw new Error(verErr.message);

    return new Response(JSON.stringify({ ok: true, version: nextNum, path }),
      { status: 200, headers });
  } catch (e) {
    console.error('generate-design', (e as Error).message);
    return new Response(JSON.stringify({ error: 'server' }), { status: 500, headers });
  }
});

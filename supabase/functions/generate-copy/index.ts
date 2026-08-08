// المرحلة ٨ — توليد نص المحتوى بالذكاء الاصطناعي (مقال/منشور/سكربت/إيميل/إعلان).
// زر «ولّد النص» ← هذه الدالة ← Claude ← يُكتب في body كمسودة معلَّمة ai_generated.
//
// عقيدة ثابتة: كل توليد يعيد ضبط المراجعة البشرية (human_reviewed_by = null)
// فلا يصل العميل نص لم تمر عليه عين بشرية — البوابة في القاعدة تفرضها.
//
// المزود عبر طبقة llm.ts الموحدة: OPENROUTER_API_KEY (مجاني) أو
// ANTHROPIC_API_KEY — في أسرار الدوال، لا يُلصق في أي شات.
// داخلية بحتة: JWT فريق (verify_jwt الافتراضي) + فحص دور في الكود.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { LLM_SETUP_MSG, completeText, llmConfigured, llmErrorMessage } from '../_shared/llm.ts';
import { teamCors } from '../_shared/team-cors.ts';

const schema = z.object({
  content_item_id: z.string().uuid(),
  directions: z.string().trim().max(1000).optional(),
});

const CHANNEL_GUIDE: Record<string, string> = {
  article: 'مقال تدوينة ٦٠٠–٩٠٠ كلمة: عنوان جذاب، مقدمة خطافية، عناوين فرعية، خاتمة بدعوة لإجراء. لا تختلق إحصاءات أو مصادر — إن احتجت رقماً ضع [أدخل الرقم من العميل].',
  social_post: 'منشور سوشيال ميديا ٤٠–٨٠ كلمة: خطاف في أول سطر، رسالة واحدة، دعوة لإجراء، ٣–٥ هاشتاقات عربية مناسبة.',
  reel_script: 'سكربت ريل ٣٠–٤٥ ثانية: خطاف (٠–٣ث)، المشكلة، الحل، دعوة لإجراء. اكتبه مشاهد مرقمة مع النص الملقى ووصف اللقطة.',
  email: 'إيميل تسويقي: سطر عنوان ≤٤٥ حرفاً + نص ١٠٠–١٥٠ كلمة، شخصي النبرة، دعوة واحدة واضحة.',
  ad_copy: 'نص إعلان مدفوع: ٣ صيغ عناوين (≤٣٠ حرفاً) + ٣ صيغ وصف (≤٩٠ حرفاً) + دعوة لإجراء. التزم سياسات المنصات (لا وعود مطلقة).',
};

Deno.serve(async (req) => {
  const headers = teamCors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { authorization: req.headers.get('authorization') ?? '' } } },
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
  const { content_item_id, directions } = parsed.data;

  if (!llmConfigured()) {
    return new Response(JSON.stringify({
      error: 'not_configured', message: LLM_SETUP_MSG,
    }), { status: 503, headers });
  }

  const { data: item } = await supabase.from('content_items')
    .select('id, title, brief, channel, client_id').eq('id', content_item_id).single();
  if (!item) {
    return new Response(JSON.stringify({ error: 'item_not_found' }), { status: 404, headers });
  }
  const { data: client } = await supabase.from('clients')
    .select('company, sector').eq('id', item.client_id).single();

  const system = [
    'أنت كاتب محتوى تسويقي أول في وكالة AGMA السعودية (الرياض). تكتب عربية سعودية',
    'معاصرة سليمة — لا فصحى متكلفة ولا عامية مبتذلة. قواعد صارمة:',
    '١) لا تختلق حقائق أو أرقاماً أو أسعاراً أو عروضاً — استخدم [أقواساً مربعة] لأي معلومة تحتاج تأكيد العميل.',
    '٢) لا إيموجي إلا في منشورات السوشيال وباعتدال.',
    '٣) أعد النص النهائي فقط دون مقدمات أو شروح أو خيارات متعددة (إلا إن طلبت القناة صيغاً متعددة).',
    '٤) التزم بذوق السوق السعودي وأنظمته الإعلانية.',
  ].join('\n');

  const prompt = [
    `القناة والمطلوب: ${CHANNEL_GUIDE[item.channel] ?? item.channel}`,
    `العميل: ${client?.company ?? 'غير محدد'}${client?.sector ? ` — قطاع ${client.sector}` : ''}`,
    `عنوان المحتوى: ${item.title}`,
    item.brief ? `الموجز من الفريق: ${item.brief}` : null,
    directions ? `توجيهات إضافية: ${directions}` : null,
  ].filter(Boolean).join('\n\n');

  try {
    const text = await completeText(system, prompt, 8000);

    // الكتابة + إعادة ضبط المراجعة البشرية (العقيدة الثابتة)
    const { error: upErr } = await supabase.from('content_items').update({
      body: text,
      ai_generated: true,
      human_reviewed_by: null,
      human_reviewed_at: null,
      status: 'draft',
    }).eq('id', content_item_id);
    if (upErr) throw new Error(upErr.message);

    return new Response(JSON.stringify({ ok: true, body: text }), { status: 200, headers });
  } catch (e) {
    const msg = llmErrorMessage(e as Error);
    console.error('generate-copy', (e as Error).message);
    if (msg) {
      return new Response(JSON.stringify({ error: 'llm', message: msg }),
        { status: 422, headers });
    }
    return new Response(JSON.stringify({ error: 'server',
      message: 'خطأ غير متوقع في التوليد — أعد المحاولة' }), { status: 500, headers });
  }
});

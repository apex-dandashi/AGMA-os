-- الاجتماعات بالذكاء (طلب المالك 2026-08-09): محضر لكل اجتماع — الصق نص
-- الاجتماع (أو ملاحظاتك الخام) ويستخرج الذكاء الملخص والقرارات وبنود العمل
-- التي تصير مهام متابعة تلقائياً. التسجيل الصوتي المباشر مرحلة لاحقة.

alter table public.meetings
  add column if not exists title text,
  add column if not exists attendees text,
  add column if not exists transcript text,
  add column if not exists minutes_md text,
  add column if not exists decisions jsonb not null default '[]';

comment on column public.meetings.transcript is
  'نص الاجتماع أو الملاحظات الخام — مدخل استخراج الدقائق بالذكاء (meeting-minutes).';

-- دليل النظام — مع الشحنة
insert into public.kb_articles (title, body_md, category, audience, published) values
(
  'دليل الاجتماعات: المحاضر والدقائق بالذكاء',
  E'## الاجتماع الأسبوعي L10\nأجندته تُجهز تلقائياً في «النظام ← الاجتماع الأسبوعي»: مؤشرات ← صخور ← أخبار ← مهام ← أهم ٣ قضايا — وتقييم الاجتماع من ١٠ يُخزن.\n\n## الدقائق بالذكاء\nبعد أي اجتماع: الصق نص المحادثة أو ملاحظاتك الخام في خانة المحضر واضغط **«استخرج الدقائق»** — الذكاء يكتب ملخصاً منظماً، ويعدد **القرارات**، ويحول **بنود العمل** مهام متابعة تلقائياً (بمالكها إن ذُكر). راجع الناتج دائماً قبل اعتماده — الذكاء مساعد لا بديل عن الحضور.\n\n## المزود\nالاستخراج يمر بطبقة الذكاء الموحدة (Claude أو Gemini أو OpenRouter بحسب المفاتيح المضافة). التسجيل الصوتي المباشر وتحويله نصاً مرحلة قادمة — حالياً انسخ النص من أداة الاجتماع (Meet/Zoom يولدان نصاً).',
  'دليل النظام', 'internal', true
)
on conflict do nothing;

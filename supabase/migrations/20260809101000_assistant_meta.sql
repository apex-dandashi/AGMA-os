-- تشخيص جودة الاسترجاع: أعلى تشابه وعدد المقاطع المرشحة لكل سؤال —
-- يغذي ضبط العتبات ولوحة «أسئلة عجز عنها المساعد» بسياق حقيقي.
alter table public.assistant_logs add column if not exists meta jsonb not null default '{}';

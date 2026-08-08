-- محرك المقالات اليومية (المرحلة ٨ ب — مخطط B2 كاملاً):
-- مصادر ← جمع إشارات يومي (cron) ← مسودة AI بمصادر موثقة ← مراجعة بشرية
-- إلزامية ← نشر في مدونة agma.com.sa (صفحات ثابتة SEO/GEO).
--
-- العقيدتان نفسهما محكمتان في القاعدة:
--   ١) مقال AI لا يُنشر قبل مراجعة بشرية موثقة.
--   ٢) النشر يمر بمسار الحالة — لا قفز.

-- ---------- المصادر (RSS مجانية — يعدلها الفريق) --------------------------
create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  lang text not null default 'en' check (lang in ('ar', 'en')),
  active boolean not null default true,
  last_collected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_sources is
  'مصادر RSS لمحرك المقالات اليومية — يجمعها cron كل صباح عبر content-collect';

alter table public.content_sources enable row level security;
grant select, insert, update, delete on public.content_sources to authenticated, service_role;
create policy "sources: team manages" on public.content_sources
  for all to authenticated using (public.is_team()) with check (public.is_team());

create trigger content_sources_updated
  before update on public.content_sources
  for each row execute function public.set_updated_at();

-- ---------- الإشارات (عناوين وروابط يومية من المصادر) ----------------------
create table public.content_signals (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.content_sources (id) on delete cascade,
  title text not null,
  url text not null unique,
  summary text,
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  used_in_article uuid
);

comment on table public.content_signals is
  'إشارات المحتوى اليومية (أخبار/أفكار المجال) — وقودُ مسودات المقالات، تُقلَّم لآخر ٥٠٠';

alter table public.content_signals enable row level security;
grant select, update, delete on public.content_signals to authenticated;
grant all on public.content_signals to service_role;
create policy "signals: team reads" on public.content_signals
  for select to authenticated using (public.is_team());
create policy "signals: team deletes" on public.content_signals
  for delete to authenticated using (public.is_team());

-- ---------- المقالات (مدونة AGMA نفسها) ------------------------------------
create type public.article_status as enum ('draft', 'review', 'published', 'archived');

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_md text,
  tags text[] not null default '{}',
  -- المصادر المستشهد بها [{title, url}] — شرط الجودة: لا ادعاء بلا مصدر
  sources jsonb not null default '[]',
  status public.article_status not null default 'draft',
  ai_generated boolean not null default false,
  human_reviewed_by uuid references public.profiles (id),
  human_reviewed_at timestamptz,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.articles is
  'مدونة agma.com.sa (SEO/GEO): مسودة AI معلَّمة لا تُنشر قبل مراجعة بشرية موثقة؛ العامة يقرؤون المنشور فقط';

alter table public.articles enable row level security;
-- العامة (anon) يقرؤون المنشور فقط — هذا ما يغذي صفحات المدونة الثابتة
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated, service_role;

create policy "articles: public reads published" on public.articles
  for select to anon using (status = 'published');
create policy "articles: team manages" on public.articles
  for all to authenticated using (public.is_team()) with check (public.is_team());

create trigger articles_audit
  after insert or update or delete on public.articles
  for each row execute function public.audit_trigger();
create trigger articles_updated
  before update on public.articles
  for each row execute function public.set_updated_at();

-- الحارس: مراجعة بشرية إلزامية لمقال AI + ختم النشر + ثبات الرابط بعد النشر
create or replace function public.article_gates()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old public.article_status :=
    case when tg_op = 'INSERT' then 'draft'::public.article_status else old.status end;
begin
  if new.status = 'published' and v_old <> 'published' then
    if new.ai_generated and new.human_reviewed_by is null then
      raise exception 'مقال مولَّد بالذكاء الاصطناعي — وثّق المراجعة البشرية (زر «راجعتُه») قبل النشر';
    end if;
    if coalesce(trim(new.body_md), '') = '' then
      raise exception 'لا يُنشر مقال بلا نص';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  -- الرابط الثابت لا يتغير بعد النشر (سلامة السيو)
  if tg_op = 'UPDATE' and old.status = 'published' and new.slug <> old.slug then
    raise exception 'رابط مقال منشور لا يتغير — أنشئ تحويلاً بدل كسر الرابط';
  end if;
  if new.human_reviewed_by is not null
     and (tg_op = 'INSERT' or old.human_reviewed_by is null) then
    new.human_reviewed_at := coalesce(new.human_reviewed_at, now());
  end if;
  return new;
end;
$$;

create trigger articles_gates
  before insert or update on public.articles
  for each row execute function public.article_gates();

-- إشعار الفريق عند وصول مسودة يومية جاهزة للمراجعة
insert into public.notification_templates (key, channel, locale, subject, body, approved) values
  ('article_ready', 'inapp', 'ar', null,
   'مقال اليوم جاهز للمراجعة: «{{title}}» — راجعه وانشره من المحتوى ← مدونة الموقع.', true)
on conflict do nothing;

-- تقليم الإشارات: أبقِ آخر ٥٠٠ غير مستخدمة (تستدعيه content-collect يومياً)
create or replace function public.prune_content_signals()
returns void
language sql security definer set search_path = public as $$
  delete from public.content_signals
  where used_in_article is null
    and id not in (
      select id from public.content_signals
      where used_in_article is null
      order by collected_at desc limit 500
    );
$$;

revoke execute on function public.prune_content_signals() from public, anon, authenticated;

-- مسودة AI تصل «للمراجعة» ← إشعار الفريق آلياً (من القاعدة لا الدالة)
create or replace function public.on_article_review()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'review' and new.ai_generated
     and (tg_op = 'INSERT' or old.status is distinct from 'review') then
    perform public.notify_team('content', 'article_ready',
      jsonb_build_object('title', new.title), null, 'art-rev:' || new.id);
  end if;
  return new;
end;
$$;

create trigger articles_review_notify
  after insert or update on public.articles
  for each row execute function public.on_article_review();

-- ---------- الجمع اليومي — cron عبر pg_net (نمط site-monitor) ---------------
-- الدالة لا تقبل مدخلات مؤثرة (تجمع من المصادر المسجلة فقط) فلا خطر من كونها
-- عامة، ومحدودة داخلياً.
select cron.schedule('agma-content-collect', '30 4 * * *',
  $$select net.http_post(
      url := 'https://gjaheqlgheizvebvakfd.supabase.co/functions/v1/content-collect',
      body := '{}'::jsonb,
      headers := '{"content-type":"application/json"}'::jsonb)$$);

-- ---------- المقال الافتتاحي (منشور — يضمن ألا تُبنى المدونة فارغة) ---------
insert into public.articles
  (slug, title, excerpt, body_md, tags, status, ai_generated,
   seo_title, seo_description, published_at)
values (
  'welcome-to-agma-blog',
  'لماذا أطلقنا مدونة AGMA — وماذا ستجد فيها كل يوم',
  'مدونة يومية تترجم آخر تطورات التسويق والذكاء الاصطناعي إلى قرارات عملية لأصحاب الأعمال في السعودية — بمصادر موثقة، بلا حشو.',
  E'يتغير التسويق اليوم أسرع مما تتغير الخطط التسويقية نفسها: محركات البحث تعيد ترتيب قواعدها، ومحركات الذكاء الاصطناعي صارت تجيب عملاءك قبل أن يصلوا إليك، والمنصات تبدل خوارزمياتها كل ربع.\n\n## لماذا هذه المدونة؟\n\nلأن صاحب العمل في السعودية لا يملك وقتاً لمتابعة عشرات المصادر الأجنبية يومياً. نحن نتابعها عنك: نجمع كل صباح أهم ما نُشر في مجال السيو والتسويق الرقمي والذكاء الاصطناعي، ونكتبه بالعربية مع ربطه بسوقنا المحلي — ماذا يعني لك، وماذا تفعل حياله.\n\n## ماذا ستجد هنا؟\n\n- **أخبار المجال مترجمة لقرارات**: لا نلخص الخبر، بل نجيب «وش يعني هذا لعملي؟»\n- **مصادر موثقة دائماً**: كل معلومة تجد رابط مصدرها في نهاية المقال.\n- **تركيز سعودي**: رؤية ٢٠٣٠، سلوك المستهلك المحلي، وأنظمة الإعلان في المملكة.\n\n## ماذا يعني هذا لعملك في السعودية؟\n\nاجعل زيارة هذه المدونة عادة صباحية قصيرة — أو اشترك في الخلاصة. حين يتغير شيء يمس عملك، ستعرفه هنا أولاً وبالعربية.',
  array['agma', 'تسويق', 'ذكاء اصطناعي'],
  'published', false,
  'مدونة AGMA — أخبار التسويق والذكاء الاصطناعي بالعربية',
  'مدونة يومية من AGMA تترجم تطورات التسويق والذكاء الاصطناعي لقرارات عملية لأصحاب الأعمال في السعودية.',
  now()
)
on conflict (slug) do nothing;

-- ---------- بذرة مصادر أولى (يعدلها الفريق من الواجهة) ----------------------
insert into public.content_sources (name, feed_url, lang) values
  ('Search Engine Land', 'https://searchengineland.com/feed', 'en'),
  ('Google Search Central Blog', 'https://developers.google.com/search/blog/feed.xml', 'en'),
  ('Social Media Examiner', 'https://www.socialmediaexaminer.com/feed/', 'en'),
  ('HubSpot Marketing Blog', 'https://blog.hubspot.com/marketing/rss.xml', 'en'),
  ('Anthropic News', 'https://www.anthropic.com/rss.xml', 'en'),
  ('MarTech', 'https://martech.org/feed/', 'en')
on conflict (feed_url) do nothing;

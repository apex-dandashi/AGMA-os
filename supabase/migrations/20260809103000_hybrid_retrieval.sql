-- استرجاع هجين للمعرفة: تضمينات gte-small للعربي «منضغطة» (كل التشابهات
-- ~0.9 والترتيب غير موثوق — قيس حياً: مقاطع تسويقية سبقت المقطع الحرفي).
-- الحل: متجهات + تشابه كلمات trigram معاً، والأعلى من الاثنين يفوز.
create extension if not exists pg_trgm;

create index if not exists kb_chunks_trgm
  on public.kb_chunks using gin (content gin_trgm_ops);

create or replace function public.match_kb_hybrid(
  p_embedding vector(384),
  p_query text,
  p_count int default 5,
  p_audiences public.kb_audience[] default array['public']::public.kb_audience[]
) returns table (
  kb_id uuid, title text, category text, content text, similarity float
)
language sql stable security definer set search_path = public as $$
  with vec as (
    select c.kb_id, a.title, a.category, c.content,
           1 - (c.embedding <=> p_embedding) as sim
    from public.kb_chunks c
    join public.kb_articles a on a.id = c.kb_id
    where a.published and a.audience = any (p_audiences)
    order by c.embedding <=> p_embedding
    limit p_count
  ), txt as (
    -- تطابق كلمات السؤال نصياً — يمسك «فحوصات التوقف» و«صخرة/الصخور»
    -- التي تضيع في المتجهات؛ درجته تُرفع فوق نطاق المتجهات ليتقدم الترتيب
    select c.kb_id, a.title, a.category, c.content,
           0.94 + word_similarity(p_query, c.content) / 20 as sim
    from public.kb_chunks c
    join public.kb_articles a on a.id = c.kb_id
    where a.published and a.audience = any (p_audiences)
      and word_similarity(p_query, c.content) > 0.35
    order by word_similarity(p_query, c.content) desc
    limit p_count
  ), unioned as (
    select * from vec union all select * from txt
  )
  select u.kb_id, u.title, u.category, u.content, max(u.sim) as similarity
  from unioned u
  group by u.kb_id, u.title, u.category, u.content
  order by max(u.sim) desc
  limit p_count;
$$;

revoke execute on function public.match_kb_hybrid from public, anon, authenticated;

# AGMA OS — Build Progress

Update after every session (CLAUDE.md). Phase specs: docs/05 §C2.

## Phase tracker

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold + CI/CD + migrate current site | ✅ Done (2026-08-06) |
| 1 | Schema / RLS / seeds / auth / audit | ✅ Done (2026-08-07) |
| 2 | CRM + Sales + website sync | ✅ Done (2026-08-07) |
| 3 | Legal generators | ✅ Done (2026-08-07) |
| 3.5 | **Quality hardening** — docs/07 quality roadmap (owner verdict: 3/10 → target 9+) | ✅ Done — Sprints A+B+C (2026-08-07) |
| 4 | Projects + playbooks + HR | ✅ Done (2026-08-07) |
| 5 | Finance KSA | ✅ Done (2026-08-07) |
| 6 | Notifications | ✅ Done (2026-08-07) |
| 6.5a | **OS-core** (docs/10): vision/VTO, seats, primary_aims, rocks, issues+IDS, scorecard+digest, L10 meetings | ✅ Done (2026-08-07) |
| 6.5b | **Safety+cash** (docs/10): pause checklists, Flag & Hold, huddles, Profit First allocations, Vault/drip, leak detection | ✅ Done (2026-08-07) |
| 6.5c | **Sellable** (docs/10): TVR scores, service_packages, custom-reason mining, playbook versions+grades, experiments, EMT/independence gauges | ✅ Done (2026-08-07) |
| 7 | Portal + onboarding + Drop Forms | ✅ Done (2026-08-09) — magic-link, docs+sign, approvals, invoices, support, assistant, forms engine + auto onboarding |
| 8 | Content Engine | ✅ Done (2026-08-08) — client-content workflow + AI drafting + portal approval + daily blog engine (RSS collect → auto-draft → review → static SEO/GEO pages) |
| 9 | Help Centre / RAG + chatbots | ✅ Done (2026-08-09) — KB+RAG core, then Help Center: 14 seeded articles (نصائح تسويقية + دليل النظام), two-tier brain (grounded/general-advice), /help site page, ops help surface |
| 10 | Employee portal + Analytics + digests | ⬜ |

## Help Center log (2026-08-09) — phase 9 tail: عقل من طبقتين + مركز مساعدة

Owner: assistant refused «كيف اسوق مشروعي» → «المساعد يحتاج تحسين … اضف
مرحلة بناء help center لكامل النظام والادوار مع مساعد ذكاء يفهم السؤال».

- `20260809080000_help_center.sql`: 14 seeded kb_articles — 6 public
  «نصائح تسويقية» (بدء التسويق من الصفر، الميزانية، اختيار المنصة، سيو أم
  إعلانات، الإعلانات لا تجيب، متى أحتاج وكالة) + 8 internal «دليل النظام»
  (المسار، المشاريع، المحتوى، الدردشة والدعم، النماذج، المالية، الحوكمة،
  الأدوار) audience 'internal'.
- assistant-ask v2 — العقل من طبقتين: threshold 0.72→0.6; grounded answer
  from KB when matches exist; general marketing questions outside KB get a
  practical answer tagged `[نصيحة_عامة]` (`general:true` in response, tag
  rendered in all 3 UIs); NO_ANSWER reserved for AGMA-specific unknowns +
  off-topic. New 'ops' surface: team JWT (active, role≠client) → audiences
  public+client+internal; non-team gets 403.
- Guard hardening from live tests: leak regex now catches singular «المقطع»
  (model cited «المقطع رقم 2»), and answers with no Arabic at all are
  refused — openrouter/free roulette once returned an English llama-guard
  safety classification as the "answer".
- kb-reindex batching: 14 articles in one call blew WORKER_RESOURCE_LIMIT
  (edge compute cap on embeddings) → BATCH=3 per invocation + `remaining`
  in response; KbAdmin reindex button loops until remaining=0.
- Marketing `/help`: browsable + searchable public KB (category groups,
  accordion, marked render, site-parity styles), in footer + sitemap;
  assistant bubble available on-page. Ops `/help/`: HelpCircle in header +
  «المساعدة» in mobile sheet → HelpCenter (search, دليل النظام first,
  audience badges) + AskPanel on surface 'ops'.
- Live-verified in production (throwaway admin, then deleted): the failing
  question answers usefully (twice), general question tagged عامة, AGMA
  salary/client-list question → NO_ANSWER handoff, internal forms question
  answered from system guide, ops without team JWT → 403. Test logs purged.

## Phase 8b log (2026-08-08) — Daily blog engine (SEO/GEO)

Owner: «ابي محرك لتنزيل المقالات اليومية في موقعنا لتقوية السيو والجيو
وعرض اخر الاخبار والافكار في مجالنا». Blueprint B2 second half.

- `20260809010000_blog_engine.sql`: content_sources (6 seeded RSS feeds,
  team-editable) · content_signals (unique url, prune-to-500 fn) · articles
  (slug/tags/sources jsonb/seo fields) with gates: AI article never publishes
  without documented human review, no empty publish, **slug immutable after
  publish** (SEO safety); anon RLS reads published only (harness section);
  article_ready notification on AI drafts reaching review; pg_cron
  'agma-content-collect' daily 04:30 UTC via pg_net; seeded launch article
  (welcome-to-agma-blog) so the blog never builds empty.
- `content-collect` (verify_jwt=false — cron calls it; accepts no input, L9):
  RSS/Atom parse (fast-xml-parser), dedupe by url, prune, then ONE auto-draft
  per day when ANTHROPIC_API_KEY exists → status 'review' + team notification.
  **Live-verified in production: first call collected 30 signals.**
- `generate-article` (team JWT): on-demand draft from picked signals or free
  topic; structured outputs (json_schema) → title/slug/excerpt/body_md/tags/
  seo fields; sources recorded from signals only (no fabricated citations —
  prompt contract). Shared `_shared/article.ts` module, claude-opus-5 +
  server-side fallback.
- Ops: المحتوى now tabbed — «محتوى العملاء» | «مدونة الموقع» (BlogAdmin):
  sources CRUD + toggle, signal picker → generate, review queue with full
  editor (title/slug/excerpt/body/SEO/tags), «راجعتُه» → publish, published
  list with live links + archive.
- Marketing (static export, SEO-first): /blog list + /blog/[slug] fully
  static pages (Article JSON-LD with citations, OG, canonical, Arabic
  locale) + FreshArticles client strip for post-build publishes linking
  /blog/read?slug (noindex reader) until next bake · sitemap.ts (all routes +
  articles) · /blog/feed.xml RSS · header+footer «المدونة» links · marked
  renderer. Build guards: empty-fetch fallback params + graceful page (export
  never breaks on DB hiccup).
- `.github/workflows/daily-rebake.yml`: daily 03:00 UTC Hostinger redeploy →
  yesterday's publishes become static HTML. **Owner action: add
  HOSTINGER_DEPLOY_HOOK_MAIN secret (hPanel Git webhook URL) in GitHub.**
- Gauntlet green: typecheck 5/5, build 2/2 (blog routes baked), RLS harness
  + blog section, e2e passed. Production: migration pushed, both functions
  deployed, live collect verified.

Owner actions pending: ONE of OPENROUTER_API_KEY (free models) or
ANTHROPIC_API_KEY (best Arabic quality) — see 8c below; plus
HOSTINGER_DEPLOY_HOOK_MAIN (daily static rebake).

## Gap-pack log (2026-08-09) — docs/17 small fixes

Owner: «حزمة الثغرات الصغيرة».

- `20260809070000_gap_pack.sql`: forms.system_key (onboarding trigger
  retargeted by key, not limit-1) + seeded **CSAT form** (7 fields incl.
  testimonial consent) auto-requested when a project turns completed —
  partial-unique keeps one pending per client (multi-project verified).
- **G2**: /contact multi-step form phone now dial select with flags (L2 LTR
  layout) composing E.164 for both lead-intake and the WhatsApp handoff.
- **G1**: complaints admin gained «اربطها بعميل» dropdown → complaints
  history lands on the client record and feeds quality loops.
- **B5 soft gate**: project cards show «استقبال العميل غير مكتمل» badge
  while the client's onboarding request is pending.
- Deferred (still needs a key/service): G6 CV malware scan.
- Gauntlet green; migration in production.

## Phase 7-tail log (2026-08-09) — Drop Forms engine + auto onboarding (B5)

Owner: «كمل ذيل المرحلة ٧ — Onboarding + Drop Forms».

- `20260809060000_drop_forms_onboarding.sql`: forms (fields jsonb, is_system
  guarded from delete) · form_requests (partial-unique pending per
  form×client) · form_responses (unique per request → single submission) ·
  private form-uploads bucket (client-folder RLS, 15MB) · notifications both
  ways · **auto onboarding**: contract-ish document signed → system form
  auto-requested once per client + portal notification. Seeded rich
  onboarding form (12 fields, explicit «لا كلمات مرور هنا» PDPL guidance).
- **RLS name-scoping bug caught by persona test**: unqualified `id` inside a
  policy EXISTS bound to the subquery table (r.id) making the form invisible
  to clients; fixed by qualifying (`forms.id`, `form_responses.form_id`).
  Lesson: always qualify outer columns in policy subqueries.
- Ops: «النماذج» nav → FormsAdmin: no-code builder (11 field types incl.
  phone/file/multi, reorder, options, hints), activate → send-to-client
  dropdown, requests status, responses viewer with signed-URL attachments +
  CSV export (BOM for Excel Arabic).
- Portal: «نماذج» tab — pending requests render engine (all types; phone with
  L2 dial layout; file → private bucket), required validation with Arabic
  per-field errors, completed history. Submission marks request completed +
  notifies team.
- Gauntlet green (typecheck/build/harness incl. new forms section/e2e);
  migration pushed to production. Phase 7 now fully closed.

## Phase 9 log (2026-08-09) — Knowledge base + RAG assistant (B6/B7 core)

Owner: «انطلق بالمرحلة ٩».

- `20260809050000_knowledge_rag.sql`: pgvector · kb_articles (audience
  public/client/internal, publish + dirty-tracking via indexed_at) ·
  kb_chunks(384) service-role-only · match_kb_chunks (definer, filtered by
  published+audience) · assistant_logs (every Q&A, unconfident = content
  gap fuel) · 5 seeded public KB articles.
- `kb-reindex` (team JWT): chunk ~800 chars on headings/paragraphs, embed
  with built-in gte-small (Supabase.ai — zero keys), cleans unpublished.
- `assistant-ask` (public, L9: rate-limit 20/h/IP + honeypot + approved-KB
  only): embed question → top-5 cosine > 0.72 → LLM answers from context
  only with citations; hardened no-guess sentinel (NO_ANSWER + leak-pattern
  detection); portal surface decodes client JWT → public+client audience +
  client_id logging. ONE brain, surfaces: site/portal (whatsapp later).
- Ops: المحتوى ← «قاعدة المعرفة» tab (KbAdmin): CRUD, audience select,
  publish, reindex button with dirty count, and «أسئلة عجز عنها المساعد»
  panel (gap mining).
- Marketing: floating SiteAssistant bubble site-wide — chat + citations +
  lead capture on low confidence (name + dial/phone L2+L11 → lead-intake
  with transcript). Portal: «المساعد» tab — same brain, client audience,
  one-click escalation creating a support thread with the question.
- **Live-verified in production**: reindex 5 articles/7s · in-KB question
  answered correctly with 3 citations · out-of-KB question refused with
  human handoff · sentinel hardening retested after fix.

Deferred: WhatsApp bot surface (plugs into assistant-ask after Twilio
number — task #7), internal-KB search UI for team, help-centre public pages.

## Phase 8g log (2026-08-08) — Support chat, admin oversight, WhatsApp rail

Owner: «طورلي الشات أقصى ما تستطيع + support chat من العميل للأقسام + مدير
النظام على اطلاع كامل بآلية منفصلة + أرد عن الشخص المعني + تنبيهات واتساب
للجميع حسب الدور».

- `20260809040000_support_oversight_whatsapp.sql`:
  support_threads/messages — client opens thread to a department
  (general/projects/finance/legal/technical); dept_roles() maps roles;
  serves_dept() drives RLS (admin+strategist see ALL — reply-on-behalf is
  just RLS-allowed insert, sender stays truthful for audit). Dept isolation
  persona-proven (pm cannot see legal). Notifications both ways
  (support_client_msg to dept roles+admins، support_team_reply to client).
  Explicit oversight policy: admin reads all team_chat incl. DMs —
  documented in-schema as a declared administrative mechanism.
  chat_reads (user × thread_key) → unread badges.
  profiles.whatsapp_enabled + notifications.whatsapp_sent_at + 5-min cron.
- `whatsapp-dispatch` (cron, no input): renders template body from
  notification_templates + payload, sends via Meta Cloud API template
  message; exits silently without provider secrets; failures never block
  the queue. **Dual-provider** (owner 2026-08-08): WHATSAPP_PROVIDER =
  meta (default, no BSP markup) | twilio (TWILIO_ACCOUNT_SID/AUTH_TOKEN/
  WHATSAPP_FROM + CONTENT_SID template; freeform Body fallback for sandbox).
  **Owner setup (meta)**: Meta app → WhatsApp → permanent token + phone id →
  WHATSAPP_TOKEN/WHATSAPP_PHONE_ID + approved Arabic template
  'agma_notification' with one {{1}} var. Email stays Resend (decided).
- ChatPanel rebuilt as محادثات center: #عام + دعم العملاء (with unread dots
  everywhere) + خاص; admin gets «الإشراف» toggle — all support across depts
  + read-only view of every DM pair; support threads open/close.
- Portal: «الدعم» tab — create request (dept select), thread list, live
  conversation, closed-state handling.
- Gauntlet green (typecheck/build/harness incl. new support section/e2e);
  migration + function in production.

## Phase 8f log (2026-08-08) — Snapshot bake architecture + editor

- Full ArticleEditor (markdown/HTML, live site-parity preview via marked,
  snippet toolbar incl. HTML CTA box, in-editor AI assistant on selection or
  whole draft via assist-writing function — live-verified 5s rewrite).
  Manual «+ اكتب مقالاً بنفسك». BlogAdmin rows open full editor.
- **Root discovery**: Hostinger build env has NO outbound network — no
  deployed build ever contained articles (local builds did). Fix:
  `scripts/snapshot-articles.mjs` writes published articles to
  `apps/marketing/content/articles-snapshot.json`; blog lib reads snapshot
  first, network fallback for local dev. daily-rebake.yml rewritten:
  snapshot → commit → push staging → ff main → Hostinger GitHub-App deploy.
  **Zero secrets needed** (HOSTINGER_DEPLOY_HOOK idea retired).
- Live-verified end-to-end: 3 articles statically baked on agma.com.sa
  (page + JSON-LD + HTML CTA + list + sitemap + RSS all ✓).
- Mobile: bottom nav rebuilt as 4 primary + «المزيد» bottom sheet (edge
  swipe conflicted with iOS app switcher); Tabs made scrollable earlier.

## Phase 8e log (2026-08-08) — Generation pipeline E2E debugging

Owner kept hitting generic «تعذر التوليد». Three stacked root causes found
by server-side E2E testing (throwaway prod user via management API, cleaned
up after):
1. CORS: supabase-js sends x-supabase-api-version — manual allow-list
   blocked every browser invoke. Fix: team-cors echoes requested headers.
2. In-function `auth.getUser()` (and getUser(jwt)) failed — platform
   returned an HTML error page to the internal auth call. Fix: functions
   behind verify_jwt=ON now decode the gateway-verified JWT directly
   (`_shared/auth.ts` verifiedUserId) — no second auth round-trip.
3. openrouter/free timed out at 120s with 16k max_tokens. Fix: article cap
   5000 / client-copy 3000 tokens, 110s fetch timeout mapped to a named
   Arabic «timeout» message.

**Proven live**: production generate-article returned 200 in 60s with a real
Arabic article (review status, ai flag, clean slug); test artifacts deleted.
Lesson recorded: never ship a team-JWT function without a real-invoke test —
bundler success ≠ working function.

## Phase 8d log (2026-08-08) — Personal profile + team chat

Owner: «وين قسم البروفايل الشخصي وتعديلاته بالسستم والشات العام وبين
الحسابات (بين الموظفين)» — L4: a «وين؟» about something missing = build it.

- `20260809030000_profile_chat.sql`: profiles + job_title/phone/avatar_path
  with self-update policy guarded by trigger (role/active/client_id/email
  changes rejected for non-admins — self-escalation persona-proven blocked);
  public `avatars` bucket (2MB, own-folder RLS); `team_chat` table —
  recipient null = #general, else DM; RLS: team-only, DM visible to its two
  parties only, sender must be self, sender deletes own; DB trigger blocks
  client recipients; realtime publication added.
- Permanent harness section: sender spoofing rejected · executor sees
  general+his DM (2) · client sees zero · self-escalation rejected.
- /profile (ProfilePanel): avatar upload with camera badge, name/job
  title blur-save, phone with L2 dial layout, personal-signature and
  password cards linking to their homes. Header now shows a person icon +
  name linking to /profile (mobile: icon).
- /chat (ChatPanel): sidebar #عام + teammates with avatars; bubbles
  (mine orange-tinted), sender names in general, hover-delete own,
  realtime via supabase channel; nav «الدردشة» added.
- Gauntlet green (typecheck, build, harness, e2e); migration pushed to
  production.

## Phase 8c log (2026-08-08) — OpenRouter free-models support

Owner: «how about we use open router for free ai models api».

- `_shared/llm.ts` unified provider layer: ANTHROPIC_API_KEY → Claude
  (structured outputs guaranteed, server-side fallback) else
  OPENROUTER_API_KEY → OpenAI-compatible chat completions, model from
  OPENROUTER_MODEL (default `openrouter/free` auto-router). Free-model JSON
  hardening: json_object response_format + fence/prefix stripping + one
  repair round-trip. 429 surfaces as Arabic «حد المجاني اليومي» toast.
- generate-copy / generate-article / content-collect rewired to the layer;
  503 setup message now names both key options. All three redeployed.
- Privacy note (PDPL): free OpenRouter endpoints may use inputs for
  training. Blog drafting inputs are public RSS — fine. generate-copy sends
  client company/sector/brief — flagged to owner; recommendation: free key
  for blog, paid/Anthropic for client content, or enable OpenRouter ZDR.

## Phase 8 log (2026-08-08) — Content Engine core

Owner: «ابدأ بالمرحلة ٨». Blueprint B2 scoped to the client-content workflow
(daily crawl/auto-select deferred until real retainers need it).

- `20260808230000_content_enum.sql` + `20260808240000_content_engine.sql`:
  content_items (5 channels × 8 statuses) with TWO DB-enforced gates —
  AI output never reaches client_review without documented human review
  (`human_reviewed_by`), and nothing publishes unless approved/scheduled.
  Gates fire on INSERT and UPDATE (no bypass by direct insert — harness-proven).
  client_review → approvals row (item_type 'content') + portal notification;
  client decision reflects back (approved / إعادة بملاحظة → internal_review)
  and notifies the team. approvals.note added (client change-request note).
- RLS: team manages; client reads own from client_review onward only.
  Permanent harness section: isolation (1 visible of 3), client update hits
  0 rows, direct published insert rejected.
- `generate-copy` edge function (team-JWT): Claude (claude-opus-5, official
  SDK, server-side fallback on refusals) drafts Arabic content per channel
  (article/social/reel/email/ad) with client company+sector context; every
  generation RESETS human review — doctrine enforced end-to-end. Needs
  `ANTHROPIC_API_KEY` in function secrets (owner action; 503 with Arabic
  setup message until then). No config.toml entry — verify_jwt stays ON.
- Ops: new «المحتوى» nav → ContentPanel: create (client+channel dropdowns,
  L1), status tabs, blur-save editor, AI generate w/ directions, «راجعتُه»,
  اعرضه على العميل, schedule date, publish + URL, delete idea/draft (L6),
  client note surfaced on returned items.
- Portal: pending-approval card renders content (channel badge, preview,
  read-full modal, اعتماد / ملاحظة إلزامية عند الإعادة); «محتواكم» card lists
  approved/scheduled/published with publish links.
- Owner mid-round request: dial-code fields unified — ONE dir="ltr" container,
  flag+code select LEFT, number RIGHT, options `{flag} {code} {country}`
  (DIAL_CODES gained flag field; Israel exclusion untouched). Applied in
  Transform, website-audit, complaints, careers, ClientsPanel; codified as
  L2 layout amendment in CLAUDE.md.
- Gauntlet green: typecheck 5/5, build 2/2, RLS harness incl. new content
  section, e2e 1 passed. Production: db push (2 migrations) + generate-copy
  deployed.

Deferred honestly: content_signals daily crawl + topic ranking (needs real
SEO retainers + search API key), auto-publish integrations, header-image
generation hookup (generate-design exists — wire when first article ships).

## Contract Library 2.0 log (2026-08-08) — docs/14, fourth owner study

Study: «مكتبة AGMA الكاملة للعقود» (33 templates + smart fields + build rules).
Verdicts in docs/14: 13 types already existed; this round closes the real gaps.

- `20260808090000_contract_library2_enum.sql` — 12 new document_type values
  (service, retainer, partnership, contractor, referral, licensing, ip_addendum,
  acceptance, renewal, termination, settlement, authorization). Own migration
  per the enum rule. All number under the CT counter (verified CT-00001).
- `20260808100000_contract_library2.sql` — `org_settings` single-row legal
  identity (seeded from CR 1009127528 + tax cert values; guard rejects a second
  row) with team-read/admin-update RLS (persona-verified: executor reads but
  UPDATE 0, client sees zero rows, admin updates representative fields) + 49
  clause seeds: 11 unified general terms into `legal` (بذل عناية، منصات الغير،
  AI، تعليق، قوة قاهرة، مسؤولية، إشعارات وتوقيع إلكتروني، نظام حاكم، لغة،
  اتفاق كامل، تنازل/لا وكالة) + 12 template clause packs.
- ContractBuilder: 3 new groups / 9 new templates (+termination in two forms);
  first party reads from org_settings (COMPANY constants as fallback); rep
  auto-prefills from client.decision_maker; custom-clause → legal-review nudge.
  MSA/service/retainer now auto-include the unified general terms.
- Settings: new admin tab «بيانات المنشأة» editing org_settings, with the
  «frozen snapshots don't change» caveat spelled out.
- Deferred with reasons (docs/14): SCC sheet (first real cross-border transfer,
  official text locked), consumer e-commerce disclosure (first B2C), reseller,
  goods-supplier; skipped: work order (=SOW), per-vertical contracts (clause
  packs instead). Signature/hash evidence log → Phase 7.
- Gauntlet green (typecheck, build, tests, RLS harness, e2e); both migrations
  pushed to production.

## Contract Library 2.1 log (2026-08-08) — owner UX round on the builder

Owner asks: edit a clause inline, reuse client representatives, company
stamp/signature + per-user signatures, and «أين أدخل السجل التجاري للعميل».

- `20260808110000_stamp_signatures.sql` — org_settings.stamp_data/signature_data
  (data URIs ≤500KB, image-check constraint) + profiles.signature_data updated
  ONLY via `set_my_signature` security-definer RPC (fixture-proved: executor
  sets own signature, direct UPDATE on another profile hits 0 rows, non-image
  data rejected with Arabic message). No self-update policy on profiles opened.
- ContractBuilder: per-clause instance editor (`overrides` — library copy
  untouched, edited chips marked *), representative dropdown fed from the
  client's contacts with «+ ممثل جديد» persisting to contacts for reuse,
  stamp + issuer signature embedded into the frozen payload snapshot.
- renderContract: signature/stamp images render inside the first-party
  signature line when present (new unit test; 40 total).
- Settings ← بيانات المنشأة: الختم والتوقيع الرسمي uploaders with preview/remove.
- Team page: «توقيعي» card for every staff member (upload/remove via RPC).
- Clients: بطاقة العميل الآن تعرض تنبيهاً برتقالياً عندما ينقص السجل التجاري
  أو الرقم الضريبي، ينقر فيفتح «تعديل البيانات» مباشرة (owner couldn't find
  where to enter client CR/VAT — discoverability fix).
- Gauntlet green; migration pushed to production.

## AI design pipeline log (2026-08-08) — «ربطها»

Owner asked to wire ad generation INTO the system, not a one-off asset:

- `generate-design` edge function (deployed, verify_jwt default ON —
  internal tool): team-role-checked (client role 403), provider-agnostic
  via IMAGE_API_BASE/IMAGE_API_KEY/IMAGE_MODEL secrets calling the
  standard /images/generations contract (b64 or url), 10MB cap, uploads
  to the private deliverables bucket under the client's folder, creates
  the next numbered version with an auto note «مولَّد بالذكاء الاصطناعي —
  راجعه بشرياً» (rule 2: human gate before any client-facing surface —
  generation lands as an internal version, sending to client stays a
  separate deliberate step).
- Ops deliverables: «ولّد بالذكاء الاصطناعي» per deliverable → prompt
  textarea (prefilled with title, guidance: describe scene/colors/style,
  no in-image text) → new version appears in the flow. Unconfigured
  provider returns the Arabic setup message straight to the toast.
- Demo seed pin repositioned off the subtitle (0.28/0.87 — on the CTA).
- Owner action: add the three IMAGE_* secrets (any OpenAI-compatible
  provider, incl. Higgsfield-compatible gateways) — button lights up
  instantly. Gauntlet green; shipped.

## Demo 2.1 log (2026-08-08) — AI-generated ad artwork

Owner: «نقدر نولد إعلان احترافي بدل هذا؟» — yes, with the session's image
generation tools:

- Generated a luxury waterfront-tower dusk shot (marketing_studio_image,
  1:1, explicit no-text prompt, AGMA palette: charcoal/burnt-orange/cream)
  → compressed to 39KB webp (sharp via pnpm store path) at
  apps/ops/public/demo/ad-bg.webp.
- Deliberate technique: AI renders the visual, Arabic copy is overlaid as
  crisp HTML (container-query cqw sizing so text scales with the image,
  text-shadows for legibility, pointer-events-none so the pin click-layer
  still owns the whole surface). AI Arabic glyphs garble; studio-grade
  Arabic typography stays HTML's job.
- Pins/draft-pin/approve flows untouched and working over the composite.
- Gauntlet green; shipped.

## Demo 2.0 log (2026-08-08)

Owner: «الديمو ضعيف أبيه كامل — أبي الزبون يجرب سستم يبهره». Full rewrite
of PortalDemo:

- Personal greeting + 4-stat dashboard strip (project 68%, tasks 34/50,
  pending decisions live counter, ROAS 3.4x) above 6 tabs.
- المخرجات: the killer feature finally IN the demo — an inline-SVG
  Instagram-ad design (real-estate campaign, no external asset) with
  fully working click-to-pin annotations (draft pin pulse → comment →
  numbered pin lands), approve / request-changes with note, V1↻V2↻V3
  history line.
- المشروع: AGMA-Method stage progress bars (100/100/80/35/0) + latest
  tasks with statuses.
- التقارير: KPI cards with deltas, weekly bar chart (CSS bars), 4-step
  conversion funnel — «من التتبع الفعلي لا من تقديرات المنصات».
- نظرة عامة: pending-actions hub (approve scope, sign contract, open
  design) + live activity timeline that UPDATES as the visitor acts
  (their signature and approval appear at the top as «الآن»).
- Signing keeps the real canvas pad; everything still 100% browser-local.
- Gauntlet green; shipped.

## L11 phone-required log (2026-08-08)

Owner: «اطلب دائماً رقم جوال للعملاء المحتملين» — codified as law L11 in
CLAUDE.md (every lead-capturing form requires phone w/ dial select,
enforced server-side too).

- lead-intake schema: phone now required (was optional-normalized) —
  MultiStepLeadForm already required it in UI, so no breakage.
- website-audit: phone required in schema + UI (dial select + 5XXXXXXXX,
  «نرسل عليه التقرير والمتابعة» error copy) + phone line in lead notes.
- TransformExperience: dial+phone fields added to «أرسل لي خطة البناء»,
  E.164 composed, submit gated on it.
- Both functions redeployed; gauntlet green; shipped.

## Transform experience log (2026-08-08) — the study's flagship WOW

- TransformExperience component on the homepage (right after hero,
  additive — hero untouched) + standalone /transform:
  «ماذا تريد أن تحوّل؟» → 4 paths (أعمالي/موقعي/تسويقي/علامتي) → 3 quick
  chip questions each (multi-select where sensible) → «وجدنا لك N فرص»
  with estimated complexity → journey map per path (business: عميل محتمل
  → تأهيل → عرض → عقد → تنفيذ → تقرير; website/marketing/brand each their
  own) where the answer-mapped nodes GLOW (pulse + shadow) — «العقد
  المتوهجة هي ما يمكن لـAGMA تحويله».
- Rule engine is a static effects map (answer → glowing nodes +
  opportunity line) — no backend, deterministic, honest.
- Lead capture: «أرسل لي خطة البناء» (name+email) → lead-intake with a
  structured summary (path, all answers, opportunities, complexity) so
  sales replies specifically, not with a template. No contact = no
  storage (data minimization).
- Gauntlet green; shipped both branches.

## Deliverable approvals + visual annotations log (2026-08-08)

- `20260808220000_deliverables.sql`: deliverables (draft/pending_client/
  changes_requested/approved) → numbered versions → pin comments
  (pin_x/pin_y 0-1 ratios, null = general); private 'deliverables' bucket
  (10MB, images only) with client-folder-path storage RLS; RPC
  `client_decide_deliverable` (owns + pending + latest version only +
  mandatory note on changes) + send/decide notifications both ways.
  Persona-proved end-to-end: hidden before send → visible after → client
  pin comment lands → old-version decision blocked → note-less changes
  blocked → approve flips status → stranger sees zero → both
  notifications fired.
- Ops (project detail → «المخرجات والاعتمادات»): create deliverable,
  upload image versions (client-path, auto-numbered), «اعرضه على العميل»,
  shared PinViewer shows client pins numbered on the image + decision
  note surfaced inline.
- Portal («المخرجات» tab): latest version image, crosshair click-to-pin
  with instant comment, اعتماد / أطلب تعديلات (note required), version
  history line V1 · V2 ✓ / ↻.
- The wa-style «عدّل الشعار اللي فوق يمين» era is over: the pin is the
  coordinate. Gauntlet green; migration in production; shipped.

## Experience AGMA demo log (2026-08-08) — WOW slice 2

- /portal/demo: fully self-contained demo portal — fictional Arabic data
  entirely in browser state (no auth, no DB call, zero footprint), same
  three tabs and the same hand-rolled signature pad; approvals decide
  locally, signing marks the doc signed with a demo evidence line, every
  interaction teaches what the real portal does («في البوابة الحقيقية
  يُحفظ سجل أدلة كامل»). Permanent «وضع تجريبي» banner + two CTAs to
  /contact.
- Marketing: header «جرّب البوابة» beside the strategy-call CTA + footer
  «جرّب بوابة العملاء» — the study's 'Experience AGMA instead of Login'.
- No migration, no new function; gauntlet green; shipped.

## Phase 7 core log (2026-08-08) — بوابة العميل

- `20260808210000_portal.sql`: document_signatures evidence table (signer,
  drawn signature image, md5 payload hash, doc version, timestamp — no
  direct DML for anyone; audit-trailed) + `client_sign_document` RPC
  (owns-doc + status=sent + name + image guards → insert evidence + doc
  status signed). Persona-proved: other client blocked, owner signs
  (hash+version recorded), re-sign blocked, direct table insert
  permission-denied, team notified on sign. Plus: client reads payments
  of own invoices; client profiles notified on doc sent.
- /portal (in ops app, own shell — clients redirected from the team app):
  magic-link login (shouldCreateUser=false, no password, no MFA for
  clients — their reach is RLS-bounded and actions go through definer
  RPCs), tabs: نظرة عامة (pending approvals one-tap اعتماد/ملاحظات +
  docs awaiting signature + project statuses), المستندات (view/print via
  the same deterministic renderers + توقيع), الفواتير والدفع (balance per
  invoice + payments + bank accounts w/ beneficiary line).
- Signature pad: hand-rolled canvas (pointer events, ~40 lines) — no new
  dependency; PNG data URI ≤ the DB image guard.
- Existing Phase-1/2 foresight paid off: client RLS for documents/
  approvals(decide)/projects/payment_accounts already existed and tested.
- Gauntlet green; migration in production; shipped.
- Next portal iterations: onboarding/Drop Forms, CSAT on project close,
  demo mode («Experience AGMA» — WOW slice 2), deliverable-version
  approvals with visual annotations.

## WOW-1 log (2026-08-08) — eighth owner study, approved slice 1

Owner approved my ranking of the micro-experiences study (real data only,
honesty thresholds, demo portal waits for the real Phase-7 portal).

- `live-stats` function (deployed, verified live in production: 100%
  uptime, 4 automations, 6 anonymized feed items): real aggregates with
  honesty thresholds (count metrics hidden until convincing at our scale)
  + whitelisted anonymized event feed from audit_log (label map only —
  no record data, no client names). First version counted never-checked
  sites as down (0% uptime on fresh DB) — fixed: uptime computed over
  checked sites only. `count_cron_jobs()` helper migration.
- /live page (2-min auto-refresh, pulse dot, metric cards, «ماذا يفعل
  نظام AGMA الآن» feed) + footer LiveStatusDot: ● أنظمة AGMA تعمل → /live,
  plus timezone-aware «فريق الرياض متصل الآن» (Sun–Thu 9–18 KSA).
- Audit scanner theater: 6-stage animated checklist fills the 30–60s
  PageSpeed wait (the wait itself became the wow).
- Application tracker: track action now accepts APP- refs (same
  email-match, status-only discipline) + «قدّمت سابقاً؟ تتبع طلبك»
  collapsible on /careers with respectful Arabic status names.
- security.txt at /.well-known/ (contact, policy → /trust, expiry).
- Gauntlet green; migration + 2 functions live; shipped both branches.

## Integrations P0 log (2026-08-08) — seventh owner study, approved slice

Owner approved my assessment of the free-APIs study: build the gold
(audit tool, client monitoring, UTM/QR, Turnstile/Resend hooks), skip the
self-hosting trap and duplicate infra.

- `20260808190000_integrations.sql`: client_sites (status/response_ms/
  ssl_expires_on/down_since) + alert trigger (down transition → site_down
  notification, verified; SSL 30/14/7/3/1-day ladder, verified) + pg_cron
  every 6h → net.http_post to site-monitor + agma.com.sa/ops seeds.
- `site-monitor` function (deployed, verified in production: both AGMA
  sites checked live, 281/180ms): input-less public function (abuse-safe:
  checks only registered sites, self rate-limited 6/h), HTTP status +
  response time + TLS cert expiry attempt via Deno.connectTls handshake.
- `website-audit` function (deployed): lead-first design — the request
  itself becomes a tagged pipeline lead even if PageSpeed fails (verified:
  lead row with «فاحص المواقع» tag on a ps_429 failure). Keyless quota is
  congested → PAGESPEED_API_KEY (free) listed as owner action; UI shows
  «سنرسل التقرير يدوياً خلال يوم عمل» on audit_failed (lead is in hand).
- public-forms: Turnstile verification + Resend confirmation emails
  (complaint w/ tracking instructions, application receipt) — both
  activate automatically when TURNSTILE_SECRET / RESEND_API_KEY appear in
  function secrets; email failures never fail the submission. website-audit
  has the same Turnstile hook. All three functions in config.toml
  verify_jwt=false BEFORE deploy (L9 — lesson applied).
- Marketing: /tools/website-audit (score rings, LCP, Arabic opportunity
  labels, CTA to /contact) + footer «فحص موقعك مجاناً».
- Ops «الموقع»: مراقبة المواقع block (live status dots, response ms, SSL
  countdown, client link, فحص الآن) + أدوات الحملات (UTM builder w/ copy,
  QR generator client-side via qrcode-generator, SVG download).
- Owner actions to finish the round: PAGESPEED_API_KEY (free, Google
  Cloud), TURNSTILE keys (Cloudflare), RESEND_API_KEY + DNS records for
  agma.com.sa — all into Supabase function secrets, never chat.
- Gauntlet green; migration + 3 functions live in production; shipped.

## Owner laws round log (2026-08-08) — docs/17

Owner: «ملاحظاتي مكررة… كيف نخليها قوانين؟ وقبل المرحلة ٧ نراجع الربط
كامل، والسياسات لازم تتجدد».

- CLAUDE.md new binding section «قوانين المالك (Owner Laws)» L1–L10:
  dropdowns everywhere, dial codes w/ Israel permanently excluded, no raw
  keys, no dead ends, Hints on numbers, deletable mistakes, Saudi Arabic,
  RTL-safe, public-form standards (incl. verify_jwt config BEFORE deploy),
  and policies updated in the same round as any public feature. Also saved
  to persistent memory.
- geo lists moved to packages/ui (single source for ops + marketing;
  ops lib/geo.ts re-exports). Careers form: city datalist + dial select
  (+966 default, E.164 compose). Complaints form: dial select likewise.
- Privacy policy §6.1 added (complaints, anonymous feedback, applicants,
  private CV storage, no discriminatory fields, talent pool 12mo +
  auto-anonymization, privacy-report lane). Terms §17 added (SLA is a
  service policy not a legal promise; no hiring obligation; upload rules).
- docs/17-integration-review.md — the pre-Phase-7 linkage audit: laws
  compliance table per screen, verified public→IMS wiring map, remaining
  gaps G1–G6 prioritized (none blocking Phase 7; G1 complaint→client link
  lands with the portal round; G3/G4 email notices wait on SendGrid).
- RLS harness made rerunnable on a non-fresh stack (frozen fixture doc now
  on-conflict-do-nothing — it collided when run twice without reset).
- Gauntlet green; shipped.

## Careers admin round log (2026-08-08)

Owner: «وين أشوف المواهب ونتائجها والسير الذاتية؟» + mid-turn «كيف أنشئ
وظيفة؟» — both answered in الفريق ← التوظيف and both UIs deepened:

- Applications now expand to «الملف الكامل»: contact/availability/salary/
  languages line, cover note, LinkedIn, and full answers review — each
  question with the chosen option and its score (n/4, orange at 4) so HR
  judges the reasoning, not just the total.
- «+ وظيفة جديدة» form with every publish-gate field (role from catalog
  w/ title prefill, occupation code w/ hint, work model/hours, experience,
  qualification, description, responsibilities, skills, benefits,
  open/close dates, localization checkbox) — saves as draft; النشر button
  still lets the DB gate be the judge.
- No migration; gauntlet green; shipped.

## Assessments log (2026-08-08)

Owner: «وين شبكة المواهب وفورمات التقييم» — talent network was live on
/careers; the assessment engine (🟡 in docs/16) built now:

- `20260808180000_assessments.sql`: assessment_questions with the
  payment_accounts column-grant pattern — anon gets (id,bank,sort,text_ar,
  options) only, `scores` column ungranted (verified: SELECT scores →
  permission denied; plain select → 71 rows). 18 banks seeded from study 6
  verbatim (COMMON culture ×3 + 17 specialty banks ×4) via a temp _seed_q
  helper. career_roles.assessment_bank mapped for all 24 roles;
  applications get answers/score/score_max via BEFORE INSERT trigger —
  scoring is server-only (perfect-answer fixture 28/28; all-B fixture
  16/28 — hand-checked).
- public-forms: apply accepts answers {uuid: A-D}; end-to-end test: anon
  REST fetch (7 questions, no scores leaked) → apply → DB computed 16/28.
- Careers form: questions render after picking role/job (fieldset radios,
  «لا توجد إجابة مثالية محفوظة» honesty note), all must be answered.
- ops التوظيف: «التقييم n/m» badge (accent at ≥75%).

## Public layer hotfix + CV upload log (2026-08-08)

Owner hit «تعذر الإرسال» on the live careers form and asked why + where's
the CV upload.

- Root cause of the failure: `public-forms` was deployed WITHOUT a
  config.toml `verify_jwt = false` entry (lead-intake had one) → production
  required an Authorization header the browser never sends → 401 → generic
  error. Fixed in config.toml + redeployed; verified live against
  production: 200 with no auth header. Lesson: every public edge function
  needs its config.toml entry BEFORE first deploy.
- CV upload (was 🟡 in docs/16, built now on request): private
  'applications' bucket (5MB, PDF/DOC/DOCX mime allowlist at bucket level),
  upload only via the edge function (service role) — multipart form-data
  (payload JSON + cv file), double validation (mime + extension), random
  server filename, original name stored separately; hr/admin read via
  120s signed URLs («السيرة الذاتية» button in التوظيف). Tested locally:
  PDF stored in bucket + row updated; .exe rejected with cv_type.
- CareersClient: file input + specific Arabic errors (type/size/rate-limit).
- e2e latent flake fixed: empty pipeline shows two «+ عميل محتمل» buttons
  (header + empty-state CTA) — spec now picks .first(); it had been masked
  by rls-check seeding a lead before e2e in the usual pipeline order.

## Public layer log (2026-08-08) — docs/16, sixth owner study

Study: «الإضافات الاحترافية للواجهة وبوابة الشكاوى والتوظيف الذكي».
Verdicts in docs/16 (question banks/interview validations/ATS dashboards
gated to first real published job; role catalog seeded at 24 not 190).

- `20260808160000_public_layer.sql`: complaints (CMP-YYYY-NNNNN counter,
  10-state workflow, per-case SLA defaults 1d/5d, privacy category →
  auto-linked privacy_breach w/ 72h clock + critical severity, security →
  auto NCR, notify_team on arrival), feedback_entries (anonymous unless
  contact_permission — function strips identity server-side, verified),
  career_departments (10) + career_roles (24 seeded w/ portfolio labels),
  career_jobs with DB publish gate enforcing MHRSD advert rules (occupation
  code, full description set, work model/hours/benefits, open/close dates,
  localization review incl. marketing-occupations rule) — rejected hr's
  incomplete publish with Arabic reason, passed when complete; anon RLS
  shows published+unexpired only (verified 1 job / 24 catalog roles);
  career_applications (APP counter, talent-pool consent → +365d,
  auto-anonymize after expiry in daily job), run_daily_jobs_v7 (auto-close
  expired jobs + complaint SLA breach alerts).
- Edge function `public-forms` (deployed): complaint/feedback/apply/track
  actions, zod discriminated union (refine moved post-parse — zod v3
  can't discriminate ZodEffects), honeypot, salted-IP rate limit, track
  returns status only after email match. All paths integration-tested
  locally (200s, 404 wrong email, honeypot swallow, validation 400).
- Marketing: /complaints (chooser → رسمية/تتبع/خصوصية preselect),
  /feedback (stars + aspects + minimization note), /careers (values,
  published jobs via anon REST, talent network form w/ neutral
  accommodations question + no discriminatory fields + independent
  talent-pool consent), /trust (privacy/security/responsible-AI/quality/
  accessibility/report — explicitly "نبني وفق" not "معتمدون"), footer
  «الثقة والحوكمة» group.
- Ops: الحوكمة ← «صوت العميل» tab (KPIs, complaint workflow w/ SLA badges,
  حل مقترح, one-click convert-to-CAPA, feedback stream); الفريق ←
  «التوظيف» section for admin/hr (applications pipeline, jobs w/ publish
  button surfacing gate errors as toasts).
- Gauntlet green; migration + function in production; shipped both branches.

## Innovation round log (2026-08-08)

Owner on the experiments modal (raw `on_time_tasks_pct` visible): «كيف نطور
الابتكار». Innovation loop (hypothesis → measure → entrench) existed since
6.5c; its entry point was hostile:

- «المؤشر المتأثر» is now a Select of the 16 scorecard metrics by Arabic
  name (fed from scorecard_metrics) — no more raw keys.
- Hypothesis placeholder teaches the formula: «إذا فعلنا [التغيير] فسيتحسن
  [المؤشر] من [كذا] إلى [كذا] خلال [المدة]».
- EXPERIMENT_IDEAS bank: 6 one-click starters sized to the agency (auto
  follow-up on open quotes → approval_lag_h; package-first pitch →
  package_revenue_pct; AI-automate a delivery step → on_time_tasks_pct;
  50% upfront gate → overdue_ar; delegate one service fully →
  delivery_by_team_pct; new lead channel → new_leads). Click fills the
  form; user edits and launches.
- No migration; gauntlet green; shipped.

## Dropdowns round log (2026-08-08)

Owner: «دروب مينيو في كل الأماكن الملائمة + الدول والمدن ومفاتيح الهواتف،
واستثنِ إسرائيل لأسباب قانونية».

- `apps/ops/lib/geo.ts` — shared lists: 25 Saudi cities, 17 sectors,
  4 budget tiers, 29 dialing codes. Israel deliberately absent from
  countries and dial codes (KSA legal requirement — noted in the file
  header so it never gets "helpfully" added later).
- Client profile: القطاع/المدينة/فئة الميزانية are datalist dropdowns
  (pick from list or type freely). Org settings: city datalist.
- Contacts: dial-code select (السعودية +966 default) beside the phone
  field — local numbers get composed (+966 5xxxxxxxx, leading 0 stripped),
  numbers typed with their own +key kept as-is.
- No migration; gauntlet green; shipped both branches.

## Cleanup round log (2026-08-08) — mistake-entry deletion + cert decision

Owner: target ISO 27001 first then 9001 (recorded in
ims_frameworks.certification_priority + docs/15 ✔), and «كيف نمسح عميلاً
دخل بالغلط / المسودات / الخ — لكل اليوزرات».

- `20260808150000_safe_cleanup.sql`: `delete_client_if_unlinked` RPC —
  blocks with Arabic reasons on finalized docs / projects / retainers /
  wallets / portal login / messages / compliance records (verified: invoice
  client rejected with «مرتبط بـ1 مستند معتمد»), otherwise cleans draft
  docs + scopes + nullifies lead/notification/issue links and deletes
  (cascade removes contacts/interactions; verified clean client fully gone).
- UI for every manager, not god-mode: «حذف العميل (أُدخل بالغلط)» in the
  client edit card (RPC surfaces the Arabic block reason as a toast);
  «حذف المسودة» on every draft document row (drafts are pre-numbering —
  no sequence gap, dialog says so); lead hard-delete inside the lead modal
  (with «الخاسرة علِّمها خسارة» guidance — cascades activities);
  draft-scope حذف in the client scopes list.
- Gauntlet green; migration pushed to production; shipped both branches.

## IMS Phase 1 log (2026-08-08) — docs/15, fifth owner study

Study: «AGMA Integrated Management System» (ISO 9001/27001/27701/22301/20000/
42001/37301 + PDPL + NCA). Verdicts sized to a 2-person agency in docs/15;
much of the spec's core already existed (immutable audit trail, versioned
document control, SoD, MFA). Built now — the audit-evidence core:

- `20260808130000_ims_core.sql`: versioned ims_frameworks (5 seeded incl.
  NCNICC as *planned/استرشادي* — applicability is a field, never hardcoded)
  + 27 controls with honest statuses (system_enforced vs manual required)
  + m2m control_mappings (access review → 27001+PDPL+NCNICC proven pattern)
  + evidence center (one evidence → many controls, valid_until) + unified
  risk register (guard: residual ≥12 acceptance is admin-only w/ written
  reason — first version read generated columns inside a BEFORE trigger,
  which are not yet computed there; fixed by computing inline) + legal
  obligations register (6 seeded) + NCR/CAPA with double close-gate
  (effectiveness note required + verifier ≠ owner).
- `20260808140000_ims_privacy.sql`: ROPA (ended activities kept 5y, DPIA
  auto-required on sensitive/cross-border), DSAR (statutory 30d computed
  from received_at in Riyadh tz via trigger — generated columns rejected
  tz expressions as non-immutable; extension ≤30d needs written reason),
  privacy_breaches (72h clock from aware_at, instant escalation to
  admin/dpo/legal + daily countdown reminders), ai_systems register
  (approval is admin-only, stamped), run_daily_jobs_v6 (DSAR 15/7/3/1/
  overdue, breach clock, obligations 30/7, control review→review_required).
- All guards fixture-proved per persona (strategist blocked from critical
  risk acceptance; owner blocked from closing own CAPA; dpo blocked from
  AI approval; extension w/o reason rejected; 62h countdown correct).
- UI: new nav «الحوكمة» — 7 tabs (overview w/ honest readiness cards,
  controls w/ framework filter + mapping badges, risks w/ scored accept
  flow, obligations, privacy [breaches w/ live countdown → DSAR w/ days
  left → ROPA], CAPA w/ effectiveness-close form, AI register).
- Gauntlet green; both migrations pushed to production.

## God mode + all-tasks log (2026-08-08)

Owner: «خلي مدير النظام عنده القدرة على تعديل أي شيء أو حذفه» + mid-turn
«لازم يكون في خيار كل المهام».

- `20260808120000_god_mode.sql` — «وضع التحرير الحر»: admin_overrides
  (15-minute self-activation, admin-only RLS, audited — first attempt failed
  because audit_trigger requires an `id` column; schema fixed to id-PK +
  unique profile_id). `god_mode_active()` early-exits all five guards:
  documents_guard (immutability incl. delete), document_review_gate,
  invoice_tax_gate, scope_collections_guard, tasks_checklist_gate.
  audit_log stays un-deletable even in god mode (verified permission denied).
  Fixture-proved: admin blocked without activation, free payload-edit +
  delete of a finalized numbered doc with it, non-admin activation rejected
  by RLS, both actions present in audit_log.
- Settings ← بيانات المنشأة: GodModeCard toggle with expiry time + honest
  warning (numbered deletions leave sequence gaps; everything logged).
- Documents: «حذف (الوضع الحر)» on every row while active, with a danger
  ConfirmDialog spelling out the sequence-gap consequence.
- My Day: «مهامي / كل المهام» segmented toggle (all-scope shows assignee
  names; RLS still bounds executors to their projects).
- Gauntlet green; migration pushed to production.

## Navigation round log (2026-08-08)

Owner on يومي: «ما أعرف وين أروح أعدل الأهداف» — dead-end screens fixed with
cross-links (deep-link params existed since Sprint A, now actually used):

- My Day: project badge is now a link into the project detail (+ explainer in
  the subtitle). A task's edit/comments/details live in its project.
- Documents + Finance: client names on every row link to the client profile.
- ⌘K global search now also covers projects and tasks (a task hit opens its
  project) — five entity kinds total.
- No migration; gauntlet green; shipped both branches.

## Roles 2.1 log (2026-08-07) — the full set, derived from docs/11–13

Owner: «إلخ = افترض باقي الأدوار المهمة بالمنطق والمراجع». Five more roles,
each boundary fixture-verified against the database:

- **sales مدير مبيعات**: pipeline/clients/quotes/contracts/projects; numbers
  quotes (Q-00055 ✓) — REFUSED invoice numbering (guided message: «المبيعات
  تطلبها ولا تعتمدها») and payments/expenses (new is_biller() gate: INV/CN
  numbering + payments + expenses + retainers restricted to
  admin/cfo/accountant/strategist).
- **pm مدير مشاريع**: full operations incl. projects/checklists — same
  financial restriction as sales.
- **collections مسؤول تحصيل**: reads invoices/clients/leads, records
  payments ✓ and promises, logs interactions — blocked from expenses ✓,
  invoice approval, and write-offs.
- **hr شؤون الفريق**: edits team data (job title, cost/hr ✓, leaves) — a
  row-level guard blocks role/active changes by anyone but a partner ✓
  (NULL-jwt semantics keep service-role invites working).
- **dpo مسؤول الخصوصية**: reads people data + audit_log ✓ — no writes.
  audit_log now app-readable by admin/auditor/dpo (harness updated: client
  persona must see zero rows, verified).

Reference roles deliberately mapped, documented in the team page: Treasury/
Tax → cfo+accountant · GL Accountant → external accountant · Security →
partner. UI: 13 role labels, per-role capability cards (matrix outgrew a
table), invite/change selects. 5 more production accounts: sales@/pm@/
collections@/hr@/dpo@agma.com.sa (password via recovery + TOTP).

## Roles 2.0 log (2026-08-07) — specialist roles + document approvals

Owner: «لازم يكون في مدير مالي، محاسب، حوكمة وقانونية… وكل واحد له صلاحيات
مختلفة» + approval workflow for documents. Delivered, DB-enforced:

**4 new roles** (enum + helper redefinition; all RLS-verified per persona):
- **cfo مدير مالي**: everything operational + sensitive finance (bank
  accounts view/manage, allocation rules, round confirmation, profit
  distributions) — not team management.
- **accountant محاسب**: full financial operations (invoices, payments,
  expenses, docs) — verified CANNOT see bank accounts or write rules.
- **legal مستشار قانوني**: operations + clause library/contract templates.
- **auditor مدقق حوكمة**: read-EVERYTHING (11 explicit read policies added
  where reads were manager-gated) — verified cannot write documents/clients.

**Document approvals (اعتمادات):** document_reviews table — request a
review by role (legal/cfo/accountant/auditor/admin) from the new ختم button
on any draft document or invoice; role holders get notified, decide with a
note (rejection requires a written reason), requester gets notified; a DB
gate refuses finalize/numbering while any review is pending or rejected —
full loop fixture-verified (request → notify legal → blocked → approve →
passes → requester notified).

**Accounts seeded in PRODUCTION** (editable later from الفريق):
cfo@ / accountant@ / legal@ / auditor@agma.com.sa — created with unusable
random passwords; passwords are set via «نسيت كلمة المرور» on the login
page (recovery email), then TOTP enrollment is enforced on first login.

UI: full role labels + 7-role capability matrix in الفريق; settings tabs
gated per specialty (بنكية/نسب → شريك+مدير مالي، بنود → شريك+قانوني).
Production migration incident: gen_salt needed schema-qualification
(extensions.) — fixed and pushed; all 31 migrations aligned local=remote.

## Print & contracts round log (2026-08-07) — owner PDF feedback + study 3

**Print fixes (owner screenshot):**
- Real AGMA logo (embedded base64 SVG, self-contained/deterministic) replaces
  the «AG» text placeholder in all four renderers.
- The flipped items table fixed: rows now match the header band — رقم البند
  والعنوان يميناً تحت «الخدمات والمنتجات»، والمبلغ يساراً تحت «المبلغ» —
  in both quote and invoice; header/amount column widths aligned (30mm);
  item cards never split across pages.

**Study 3 (contract library, docs/13) — sized P0 executed:**
- ContractBuilder is now فئة ← نوع (grouped select) with per-template
  «الحزمة المقترحة» hints — the study's tree instead of a flat dropdown.
- 4 new document types (change_order, dpa, media_auth, influencer — enum in
  its own migration) + NDA split into متبادلة/أحادية variants.
- 29 new approved clause seeds (clause_library now 42): SOW ×5, DPA/PDPL ×6
  (incl. 72-hour breach + SCC transfer + subprocessors), media-budget
  authorization ×6 (spend≠revenue, caps, account ownership), influencer ×7
  (موثوق licensing, usage rights, whitelisting, exclusivity), change order
  ×4, one-way NDA. All flagged: final approval by a Saudi lawyer —
  **قرار شركاء**.
- Renewal alerts extended to the new types. Scheduled-with-triggers and
  skipped items documented in docs/13 (e-signature → portal, SCC templates →
  first cross-border transfer, vendor/HR+Qiwa → first hire, CLM
  17-state lifecycle → skipped at this scale).

## Study-2 gap package log (2026-08-07) — docs/12 adopted items

Second owner study («الهيكلية المرجعية للنظام المالي ودورة حياة العملاء»)
ingested and compared against docs/11 → docs/12 with per-item verdicts.
The five sized adoptions, all fixture-verified and shipped:

1. **Invoice disputes**: disputed_at/reason on documents; the entire dunning
   ladder skips disputed invoices (verified: zero actions, no hold);
   «نزاع/حل النزاع» toggle + badge on the invoice row.
2. **Revenue-leakage detection** (المال المنسي): revenue_leakage view — (a)
   hours logged in 30d with no finalized invoice in 45d (est. value from
   cost rates), (b) completed project with no invoice ever. Both signals
   verified; surfaced in الإيراد tab with an orange «منفَّذ غير مفوتر» section.
3. **Monthly light close**: seeded «الإقفال الشهري الخفيف» READ-DO checklist
   (9 items: bank match, receipts, invoicing, allocation rounds, revenue
   sanity, leakage review, statements, backup check, accountant export) —
   the sized alternative to a full GL close.
4. **Arabic search normalization**: normalize_ar (أ/إ/آ→ا، ة→ه، ى→ي) +
   generated norm columns + trgm indexes on clients/leads; duplicate warning
   now matches «شركه الابداع» ↔ «شركة الإبداع» (verified).
5. **Contract renewal alerts**: contracts can carry an expiry date
   (ContractBuilder field → valid_until); daily job v5 notifies at 60 and
   30 days («قرروا التجديد أو الإنهاء») — verified at +60.

Also: PDF pagination polish (thead repeats, rows/clauses never split across
pages). Scheduled-with-triggers (docs/12 🟡): lead scoring, milestone-gated
billing (portal), unapplied cash (PSP), utilization (first hire).

## Clarity round log (2026-08-07) — bug fix + hints + role re-engineering

**Bug (owner report): الحسابات البنكية hung on skeletons.** Root cause:
phase-0 column-level SELECT grants on payment_accounts (internal_label
excluded by the «لا يظهر للعميل» rule, created_at ungranted) — the settings
tab's select * + order by created_at hit permission-denied, and settings
tabs had no error state. Fix (migration 20260808010000): definer view
payment_accounts_admin (admins get everything, non-admins zero rows —
verified both personas; base table stays column-restricted so Phase-7
portal clients can never read internal labels) + created_at grant. All 7
settings tabs now render a clear error + retry instead of eternal skeletons.

**Hint icons everywhere (owner request):** new ui `Hint` component
(hover/click tooltip, RTL, inline SVG, keyboard accessible). Wired: client
360 stats (meaning + number source + where to edit), all 16 scorecard
metrics (METRIC_HINTS: formula/source/target), allocation cards (reserve
formula, months formula, where to edit ratios), AR aging, TVR heading,
team table headers (صلاحية/مقاعد/تكلفة/عبء).

**Roles re-engineered (owner: «استراتيجي ومنفذ ضعيفة وغير واضحة»):**
the enum is a 3-tier SECURITY lattice, not job titles — the confusion was
presenting it as roles. Now: شريك / مدير عمليات / عضو تنفيذ + a collapsible
«ماذا يستطيع كل مستوى؟» capability matrix (mirrors actual RLS), the job
described by المسمى الوظيفي + new المقاعد column (EOS seats held, edited in
الرؤية), and People-Analyzer G/W/C headers renamed يفهم دوره/يريده/قادر عليه.
No enum/RLS change — zero breakage. docs/11 source text also stored as
docs/11-finance-platform-design-source.md.

## المالية ٢٫٠ log (2026-08-07) — docs/11 §ب, all six items

1. **Deferred revenue & recognition (IFRS 15, agency-sized):**
   revenue_schedules auto-generated at finalize — retainer lines
   («اشتراك شهري», both UI and cron paths) defer over the service month;
   everything else recognizes at issue; credit notes recognize negative.
   Daily recognize_revenue() + revenue_waterfall view. New «الإيراد» tab:
   deferred balance card, monthly مفوتر/مثبت/مؤجّل table, upcoming
   recognition schedule. Fixture-verified: 13,000 invoiced → 8,000
   recognized + 5,000 deferred. توزيع الدخل stays cash-based BY DESIGN.
2. **Full dunning ladder** (run_dunning, replaces the +3/+7 pair): −7
   gentle email → +7 email + collection task → +15 manager escalation →
   +30 collections_hold + auto-issue + alert → +45 payment-plan/legal
   decision. Active payment promise pauses client-facing chasing only
   (team tasks continue) — all fixture-verified including the hold flag,
   the auto-issue, and the promise pause.
3. **Credit limits & payment terms:** clients.credit_limit /
   payment_terms_days / collections_hold + profile editing + hold badge
   with admin release. Invoice due date now computed from the client's
   terms; finalize dialog warns when the open balance would breach the
   limit. New-work hold enforced by DB guard on scope send (verified).
4. **Tax-invoice gate:** VAT invoice for a client without a vat_number is
   refused at the database with guidance (verified).
5. **Tax calendar:** VAT quarterly (1 Jan/Apr/Jul/Oct), WHT day-3 check for
   last-month non-resident supplier expenses (new wht_applicable flag +
   «استقطاع» badge), Zakat April-1 heads-up. In run_daily_jobs_v4 (cron
   repointed).
6. **Payment sessions (adapter-ready):** payment_sessions table +
   PaymentProvider interface; manual_transfer provider generates a unique
   AGMA-PAY reference + copy-ready Arabic transfer instructions from the
   invoice row. PSP (mada/Apple Pay hosted checkout) drops into the same
   interface — provider choice logged as قرار شركاء. Card data never
   stored, by rule.

All gates green; migration applied to production.

## Language review log (2026-08-07) — clear Saudi Arabic everywhere

Owner feedback: too many literal translations and unexplained jargon. Full
copy sweep — UI strings, tab names, toasts, hints, and the DATABASE error
messages/notification templates now speak the same plain voice:

- EOS jargon translated to meaning, not words: الصخور → **الأولويات
  الربعية** · القضايا → **المشاكل والعوائق** · النتائج → **المؤشرات** ·
  «حلّ (IDS)» → «ناقشها وحلّها» · L10 explained in a plain intro line.
- Profit First: طقس التوزيع → **جولة توزيع الدخل** · الخزينة →
  **الاحتياطي** («كم شهراً يغطي الاحتياطي مصاريفنا؟») · CAP→TAP →
  «النسبة المطبّقة الآن ← النسبة التي نتدرج إليها».
- Gawande: Flag & Hold → **«أوقِف وراجِع»** · «لحظة التجمّع» → «وقفة سريعة
  قبل الإطلاق» · flagged state explains what happened and what to do next.
- بلاي بوك → **دليل العمل** everywhere · «تسرب نطاق» → «عمل خارج الاتفاق» ·
  الريتينرات → الاشتراكات الشهرية · SoW/GWC/READ-DO English tags dropped or
  explained inline.
- Every OS tab now opens with a one-line plain explanation of what it is and
  when it's used (المؤشرات، الأولويات، المشاكل، الاجتماع).
- Migration 20260807230000: DB guard messages rewritten with guidance («لا
  يمكن إنجاز المهمة قبل اجتياز قائمة الفحص — افتحها من زر فحص الإطلاق»)،
  notification templates flag_hold/allocation_ready rewritten. Verified live.

All gates green; migration applied to production.

## Package B log (2026-08-07) — serious Saudi invoicing (parity push 2/3)

- **ZATCA Phase-1 QR** (mandatory on Saudi tax invoices since 2021): TLV
  encoder (tags 1–5: seller, VAT number 313630147, ISO timestamp, total incl.
  VAT, VAT) → base64 → deterministic SVG QR via qrcode-generator (pure JS, no
  network). Renders ONLY on numbered invoices carrying issuedAtIso (finalize
  now stamps it) — never on drafts or credit notes. 4 new tests including a
  TLV decode round-trip; suite now 39.
- **Default service prices** (Odoo starts from a priced product): catalog
  gained default_price, editable in settings/الخدمات; the scope builder shows
  a live «تقدير مبدئي من أسعار الكتالوج»; quote-from-scope prefills line
  amounts instead of zeros. NULL price = «تسعير حسب النطاق».
- **Client statement PDF** (deferred since Phase 5, now closed):
  renderStatement — finalized invoices & credit notes with paid/balance per
  row, closing totals (CNs subtracted — verified 8,000/5,750/2,250 fixture),
  same visual family, deterministic + tested. «كشف حساب» button on the
  client's documents section.

All gates green; pricing migration applied to production.

## Package A log (2026-08-07) — files & collaboration (parity push 1/3)

Closing the first structural gap vs the reference systems: the OS now HOLDS
the work, not just its record.

**Files everywhere (Supabase Storage, first use):**
- Private bucket `attachments` (20MB cap), signed-URL downloads only, team
  RLS on storage.objects; polymorphic attachments metadata table (audited).
- Reusable AttachmentsBlock/AttachmentsButton wired into: tasks (paperclip
  on every row), documents («ارفع النسخة الموقّعة» hint on signed ones —
  closes yellow #18), expenses (receipt/supplier tax invoice), and a «الملفات»
  section on the client page. Arabic filenames preserved in metadata, keys
  ASCII-sanitized.

**Record-level collaboration:**
- task_comments (mentions uuid[], author-delete, audited) + thread modal on
  every task row: discussion count badge, mention chips (@member), author/time.
  «ابدأه هنا لا في واتساب».
- Targeted notifications (fixture-verified): comment → mentioned users +
  assignee (author excluded, deduped); assignee change → new assignee
  notified. New templates task_comment / task_assigned.

All gates green; migration applied to production.

## Orange package log (2026-08-07) — usability audit items 11–16

11. **Manual scorecard entry**: admins record values for source='manual'
    metrics (NPS وأمثالها) for the current week — green/red computed against
    the threshold on save. The metrics can finally light up.
12. **Primary Aim page** (E-Myth root node): private card at the top of the
    Vision tab — «أي حياة يجب أن تشتريها لك هذه الشركة؟» + optional shared
    excerpt. RLS is owner-only: each partner sees only their own.
13. **People Analyzer** (EOS): new people_reviews table (migration
    20260807200000, admin-write/team-read, audited) + quarterly grid in
    الفريق — click-to-cycle +/±/− per core value and ✓ per G/W/C, partners
    rate each other first. Values come live from the V/TO core values.
14. **Service catalog editor**: settings tab الخدمات — rename, activate/
    deactivate (hidden from scope builder, history preserved — no deletes by
    design), add new service with auto slug per category.
15. **Task-template editor**: settings tab قوالب المهام — per-template EMT
    class (feeds the Technician gauge) and pause-checklist binding, filtered
    by playbook.
16. **Retainers manageable**: pause/resume switch (cron already skips
    inactive — verified), inline edit of title/amount/billing day (1–28).

All gates green; people_reviews migration applied to production.

## Red package log (2026-08-07) — usability audit items 1–10

From the systematic «أين أدخل…؟» audit; the high-priority ten, all shipped:

1. **Quote from scope**: «عرض سعر من النطاق» on every scope card — items
   prefill from the scope's services, client fixed, document links scope_id.
2. **Contacts manageable**: inline edit (name/phone/email), delete with
   confirm, «تعيين رئيسياً» (single-primary enforced) — hover controls.
3. **Interactions manageable**: inline summary edit + delete with confirm.
4. **Conversion carries contact**: converting a lead now parses الهاتف/البريد
   from the intake notes into a structured primary contact (normalization
   triggers apply). No more retyping from the notes blob.
5. **Client documents in place**: «المستندات والفواتير» section on the client
   page (type, number, status, total, date) — management stays in its panels.
6. **Ad-hoc tasks**: «+ مهمة» per stage (strategist+; title + due). Toast
   reminds: untemplated work counts as scope leak — by design.
7. **Task editing**: title + due date inline edit, delete with confirm
   (strategist+), executor sees none of it.
8. **Time entries manageable**: TimeLogModal lists prior entries (who,
   minutes, note); members delete their own (new RLS policy), strategist+ any.
9. **Expenses correctable**: inline edit (category/amount/supplier) + delete
   with a warning that it moves OpEx averages and vault months.
10. **VAT end-to-end**: ١٥٪ checkbox in QuoteBuilder → vatAmount in payload →
    renderers (already supported) → carried into invoice conversion →
    included in documents.total at finalize (payments/balance correct).

All gates green; time-entry policy migration applied to production.

## Gaps round log (2026-08-07) — owner walkthrough fixes

The owner walked the app and hit real walls: «أين أدخل بيانات العميل؟ موقع
شركته؟ كيف أنشئ عقد عدم إفصاح؟ كيف أعدّل الإعدادات؟». All closed:

- **Full client profile**: clients gained website / city / cr_number /
  vat_number. New «بيانات العميل» card on the client page — sector, decision
  maker, budget tier, status, tags, website (clickable), CR and VAT — all
  editable in place. CR/VAT will feed contracts and ZATCA invoicing.
- **NDA in three clicks**: ContractBuilder in المستندات («+ عقد / عدم
  إفصاح») — type selector (nda/sow/sla/msa/amc/coc), client prefills the
  second party (with CR + representative), 7 seeded NDA clauses arrive
  pre-picked (تعريف السرية، الالتزامات، الاستثناءات، مدة ٣ سنوات، الإعادة
  والإتلاف، التعويض، النظام السعودي/الرياض), custom clauses addable,
  live preview via renderContract, draft → finalize.
- **Contracts numbering**: new gapless CT-00001 counter; finalize button now
  works for every draft type (was quote-only) and picks Q/CT by type.
- **الإعدادات page** (nav entry, admin-only): bank accounts CRUD with Saudi
  IBAN validation + single-default enforcement · clause library editor with
  approve toggles · pause-checklist editor (1–9 items enforced) · allocation
  CAP→TAP editor with sum=100% guard (the قرار شركاء enabler) · notification
  template approve/active switches. Backed by new admin RLS policies on
  payment_accounts and notification_templates.

All gates green; migration applied to production.

## Data round log (2026-08-07) — entry → processing → output → AI-readiness

**Entry layer (every path produces the same clean value):**
- DB normalization triggers on contacts/leads/clients: trim, email lowercase,
  Arabic-Indic + Persian digits → Latin, Saudi phones → E.164
  (normalize_phone_sa: ٠٥٥→+9665، 00966→+966، foreign numbers untouched —
  all cases fixture-verified). One-time cleanup ran on existing rows.
- Identical normalizers in packages/db schemas (zod transforms on phone/email)
  and in the lead-intake edge function (redeployed) — form, API, and SQL
  entries converge on the same representation. Website intake now .catch()es
  bad phones to undefined instead of rejecting the lead.
- pg_trgm + trigram indexes on clients.company / leads.name/company — fast
  fuzzy duplicate detection and search.
- Contact quick-form now captures email (with inputMode/ltr); the biggest
  data_quality gap generator closed at the source.

**Processing/consumption layer — 5 RLS-respecting views (security_invoker):**
- client_360: one row per client — contacts, last interaction, projects,
  scopes/packages, invoiced/paid/balance, pending approvals, wallet budget.
  The retrieval surface for Phase-8 RAG/chatbots and any report.
- pipeline_analytics: win rate, avg days-to-win, open value per source.
- document_margins (total vs internal cost), project_costs (hours + labor
  cost per project via time_entries × cost rates).
- data_quality: named gaps (client no sector/contacts/90d-silence, contact
  unreachable, open deal missing value/close-date/next-activity, lost deal
  without reason) — fixture-verified flags.

**Output layer:**
- Client 360 summary card on the client page (invoiced/paid/balance, active
  projects, pending approvals, last touch, «عميل باقات» badge).
- «جودة البيانات» section in التحسين tab: grouped gap counts for the L10.
- Source-performance strip on the pipeline (win % + cycle days per source,
  appears once deals have closed).
- Projects CSV export from project_costs (incl. hours + labor cost);
  shared lib/format.ts replaced per-panel fmt duplicates.

All gates green; migration + lead-intake deployed to production.

## Review round log (2026-08-07) — post-6.5, pre-Phase-7

Code review of the 6.5 layer + audit against the docs/08 benchmark criteria.

**Bugs found & fixed (migration 20260807160000_review_hardening):**
- **Flag & Hold deadlock (critical):** the done-gate checked «any flagged run
  ever», so a task once flagged could NEVER complete, even after a fresh
  checklist run passed. Gate now judges the latest run only. Verified all
  three paths: no-run → blocked · flagged latest → blocked · new passed run
  → done succeeds.
- **pause_checklists were frozen:** no write policy or grants existed — even
  admins couldn't update a checklist after an incident, violating the
  Gawande living-document rule. Admin-manage policy + grants added.
- **Allocation confirmation tightened to admin-only** (bank transfers are a
  partner act); team keeps read. UI hides the confirm button for others.
- ChecklistRunModal: a flagged run silently spawned a fresh run on open,
  hiding the flag reason. Now: flagged banner with reason + explicit
  «إعادة الفحص من البداية» action; checkboxes frozen while flagged.
- AllocationsTab: vault-reserve math simplified to match the SQL exactly.

**Benchmark gaps closed (docs/08 «Adopt» items that had slipped):**
- §1 Duplicate detection: new-lead form warns (never blocks) when a similar
  lead/client name or company exists.
- §2 Margin on quote lines: internal-only cost field per line + live margin %
  (red < 40%) in QuoteBuilder. Costs stored in new team-only document_costs
  table — deliberately OUT of documents.payload, which Phase-7 clients will
  read. «داخلي — لا يظهر في العرض».
- §3 Payment-reminder ladder: overdue +3d and +7d client emails join the
  due-tomorrow reminder (send_overdue_reminders, run_daily_jobs_v3, cron
  repointed) + in-app alert to partners. Verified via fixture.
- §6 CSV export (PDPL + owner habit): exportCsv util (Excel-safe BOM) with
  export buttons on pipeline, clients, invoices, and expenses lists.

**Benchmark audit — confirmed already delivered:** next-action discipline,
deal value/close/won-lost reasons, tags, UTM, quote supersede chain, quote
expiry cron, recurring-invoice auto-draft, AR aging, ad wallets, my-day,
dependencies, workload-lite, activities engine.
**Still deferred (unchanged, honest):** client statement PDF, CSV import,
ZATCA Phase-2 API, saved filters, portal items (Phase 7).

## Phase 6.5c log (2026-08-07)

**Built to Sell + E-Myth (docs/10 §2.1 + §2.5):**
- **TVR filter**: services_catalog gains teachable/valuable/repeatable 1–5
  scores, editable in the new الباقات tab — sum ≥12 flags «مرشّحة كباقة».
- **service_packages** seeded from proven demand: Launch Kit (= quote 00054,
  Option-1/Option-2 kept, 100% upfront), Growth Retainer (monthly-ahead),
  AI Starter (upfront). All seeded **inactive**: a DB guard refuses activation
  while any linked playbook is documentation-grade C or the price is unset
  (both verified) — «grade C cannot be sold» enforced at the database.
- **Say-no mechanism**: ScopeBuilder is package-first; a custom scope requires
  why_no_package_fit (DB trigger blocks sending without it — verified) +
  optional custom_premium_pct. Reasons mined in التحسين tab (90-day list) for
  the quarterly «السوق يصمّم منتجاتك» review.
- **Playbook versioning**: playbook_versions (semver) + documentation_grade
  A/B/C + doc_gaps per playbook, grade editor + version history in UI.
- **Experiments** (Innovation → Quantification → Orchestration): hypothesis →
  running → won/lost. Won with a playbook auto-releases the next minor version
  (verified 1.1.0 → 1.2.0) + notifies the team; lost documents the lesson and
  releases nothing (verified). New notification template experiment_decided.
- **Owner-independence**: tasks.executed_by auto-stamped on done;
  task_templates.emt_class (entrepreneur/manager/technician). 3 new scorecard
  metrics via compute_scorecard_v3 (cron repointed): package_revenue_pct ·
  owner_technician_pct · delivery_by_team_pct — fixture-verified 100% for a
  non-partner-executed task.
- incentive_plans stub (admin-only RLS) for the first senior hire.

Honest deferrals: package pages on the marketing site; AI Scope Drafter
(sales-independence stage 1 tooling) — Phase 8 territory.

All gates green; production migration applied.

## Phase 6.5b log (2026-08-07)

**Gawande (docs/10 §2.3):**
- 10 checklists seeded: 5 DO-CONFIRM launch gates (campaign/website/content/
  invoice/automation, ≤9 killer items enforced by check constraint) + 5
  READ-DO runbooks (allocation ritual, ZATCA day, security incident, PDPL
  deletion, partner absence).
- Launch task-templates in market-phase stages carry checklist_key; a DB
  trigger REFUSES marking them done without a passed run, and refuses while
  a Flag & Hold stands.
- **Flag & Hold**: anyone flags with a reason → run blocked + Issue auto-filed
  + team notified. Huddle card in the run modal names each assignee and their
  piece («اعتراضات؟» — أصغر عضو له سلطة الإيقاف). Per-item checker+timestamp
  recorded.
- Verified: done-without-checklist rejected with «نقطة توقف…» · pass→done
  succeeds · flag filed issue + notification.

**Profit First (docs/10 §2.4):**
- allocation_rules with CAP→TAP (placeholder %s marked قرار شركاء),
  allocations generated on the 10th & 25th by the daily cron from
  **payments only — wallet ad-money provably excluded** (verified: 20k wallet
  spend invisible to a 10k allocation → 500/300/1500/1500/6200 = exact).
- Ritual UX: pending card with amounts + READ-DO transfer checklist +
  confirm (audited); vault-months meter (reserve ÷ 90-day OpEx avg);
  quarterly profit-distribution event (50/50 default).
- 4 new scorecard metrics: allocation_on_time · vault_months ·
  scope_leak_sar (untemplated task hours × cost rate) · flags_raised
  («الصفر الدائم إشارة سيئة»). Sunday cron now computes 12 metrics.

All gates green; production migration applied (crons updated to v2).

## Operating System adoption (2026-08-07)

Owner supplied docs/10-operating-principles.md v2 — five frameworks fused
(E-Myth · EOS · Checklist Manifesto · Profit First · Built to Sell).
Supersedes docs/09. Phase 6.5 split into a/b/c (tracker above). The doc's
Part-4 phase wiring predates phases 1–6 shipping, so its deltas are absorbed
into the 6.5 arc instead:
- 6.5a OS-core: vision/VTO · seats (one name per seat) · primary_aims
  (private per partner) · rocks (3–5 cap enforced) · issues+IDS (root-cause
  required, recur→reopen, auto-filed from 2-week-red scorecards) ·
  scorecard_metrics/entries with Sunday 07:00 digest · L10/quarterly/annual
  meeting packs.
- 6.5b safety+cash: pause_checklists/checklist_runs at stage transitions ·
  Flag & Hold (anyone; zero-flags-is-the-bad-sign metric) · huddle prompts ·
  last_caught_at hygiene · allocation_rules/allocations on the 10th/25th ·
  Vault months meter · OpEx drip · scope-creep leak report ·
  media-wallets-never-allocated guard (wallets already pass-through).
- 6.5c sellable: TVR scoring on the 32 services · service_packages (Launch
  Kit = quote-00054 shape, Growth Retainer, AI Starter) · upfront-payment
  default · why_no_package_fit mining · playbook_versions + documentation
  grades (grade C unsellable) · experiments (Innovation→Quantification→
  Orchestration) · Technician-% and owner-independence gauges.

**BLOCKING INPUT — the seven partner decisions (docs/10 Part 5):** Primary
Aims · Core Values + Core Focus wording · TAPs + comp split · scorecard
targets · first quarter's Rocks · package pricing · the fixed weekly meeting
slot. The 6.5a build ships with placeholder seeds clearly marked; the partner
session locks them in.

## Phase 6 log (2026-08-07)

**Built (docs/05 §B8 — one event-driven engine, rule 6 enforced):**
- Migration `20260807120000_notifications`: template registry (AR seed set for
  invoice issued/due/overdue, 48h approval nudge, task overdue, wallet 80%,
  retainer generated, quote expired) · unified queue+send-log table with
  dedupe keys · `enqueue_notification()` / `notify_team()` helpers.
- **Event triggers:** invoice finalized → client email + team in-app ·
  approval created → 48h nudge scheduled (email to primary contact + in-app),
  **auto-cancelled when the approval is decided**.
- **`run_daily_jobs()`** (pg_cron 09:00 KSA): quote expiry sweep · retainer
  auto-generation on day-of-month (draft invoice + team alert, monthly
  dedupe) · due-tomorrow reminders · overdue chasing (weekly dedupe, client
  email + team in-app) · per-assignee task-overdue digests · wallet-80%
  crossings (once per wallet).
- **`dispatch_notifications()`** (pg_cron every 5 min): in-app instantly;
  email via pg_net→SendGrid with the key read from **Vault** — until the key
  exists messages queue gracefully; quiet hours 08:00–20:00 Riyadh for
  outbound; WhatsApp rows skip with a note (owner's deferred-Twilio call).
- **ops UI:** inbox bell (unread badge, mark-all-read, realtime) + admin
  سجل الإشعارات page (full audit log per §B8).

**Verified locally:** fixture run — retainer generated draft invoice, overdue
email queued (no key = graceful), team in-app sent, nudges scheduled then
cancelled on approval, 2 crons installed · RLS harness · e2e · 33 tests ·
builds. Production migration applied (crons + triggers live).

**Activation (owner, SETUP §6):** one SQL line puts the SendGrid key in Vault
→ email channel goes live on the next dispatch cycle. WhatsApp activates
post-build per your decision (sender + Meta templates, SETUP §5).

## Phase 5 log (2026-08-07)

**Built (docs/05 §B3 · docs/06 §3 · docs/08 §3):**
- Migrations `20260807110000/110100`: invoices + credit notes join the
  immutable documents engine (document_type extended in its own txn);
  `documents.total` frozen at finalization; `payments` with DB guards
  (finalized invoices only, never exceed balance, no paying void docs);
  `recurring_invoices` retainers; `expenses`; ad-spend `wallets` +
  `wallet_entries` (client budgets never blend with revenue). Realtime on
  payments.
- **renderInvoice** in legal-templates: فاتورة / إشعار دائن on the reference
  anatomy — sidebar payment details, paid/balance dark box, reserved VAT row
  «—», recurring-renewal callout (docs/06 §3.6), source-quote reference,
  negative-signed CN amounts. **11 new golden tests (33 total).**
- **ops → المالية** (4 tabs):
  - الفواتير: create from a finalized quote (payload carries over — no
    retyping), finalize assigns INV number + freezes total + 14-day due date,
    payment recording (bank ref, per-account, "كامل المتبقي"), status chips
    (مسودة/مستحقة/جزئي/مدفوعة/متأخرة/ملغاة), **AR aging strip**
    (current/30/60/90+), credit-note creation from any finalized invoice,
    print with live paid/balance.
  - الاشتراكات: retainers with day-of-month + "توليد فاتورة الآن" (Phase 6
    cron automates); المصروفات: quick-add + month total; محافظ الإعلانات:
    budget vs spend progress with 80% highlight.

**Verified:** INV-00053 and CN-00001 issued in true sequence · overpay guard
raises · migration replay · RLS harness · e2e (extended with finance page,
switched nav assertions to goto after diagnosing a dev-compile race via the
Playwright trace) · 33 generator tests · builds/typecheck. Production
migrations applied.

**Deferred:** ZATCA Phase 2 API (flagged, per §B3 — confirm wave with
accountant) · payment reminders + retainer cron + wallet 80% alert → Phase 6 ·
client statement PDF → with portal documents area (Phase 7) · line-level
margin capture → when time-cost data accumulates.

## Phase 4 log (2026-08-07)

**Built (docs/03 both modes · docs/04 §1.4/1.6/2.2 · docs/08 backbone):**
- Migration `20260807100000_projects_hr`:
  - tasks now belong to projects directly (sprints optional → milestone mode
    works), carry playbook stage, `blocked_by` dependency, sort.
  - `create_project_from_playbook()`: instantiates project + all task
    templates with cumulative due dates; each stage's tasks blocked by the
    previous stage's client-approval gate (docs/04 flow #2).
  - **THE BACKBONE**: `on_scope_approved` trigger — approving a scope
    auto-creates one project per scoped category. Verified: 1 approval →
    2 projects, 28 tasks, 6 gates, 18 dependency-blocked, scope auto-approved.
  - `time_entries` (member logs own; feeds cost via profiles.cost_rate_hourly)
    + HR fields on profiles (job_title, phone, cost rate, capacity, skills)
    + `leaves` table. Realtime on tasks/time_entries.
- **ops → المشاريع**: project cards with AGMA Method™ phase pills +
  recurring/milestone badges, deep-linked detail with stage-grouped task board
  (status, assignee, due, approval-gate ShieldCheck badge, Lock badge with
  blocking-task tooltip, status select disabled while blocked), quick time
  logging (15/30/60/120 presets), create-from-playbook modal.
- **ops → يومي** (docs/05 §B9): my open tasks across projects, overdue-first,
  inline status; header shows open/overdue/activity counts.
- **ops → الفريق**: HR columns (job title + cost rate admin-editable inline),
  workload heatmap-lite (open-task count per member, hot ≥ 8).

**Verified:** migration replay · backbone trigger test · RLS harness (fixture
updated for tasks.project_id) · e2e golden path · builds/typecheck/tests.

**Deferred:** sprint-cycle UI for recurring projects (cadence automation lands
with Phase 6 crons) · CSV import (docs/08 P4 item → next session) · leaves UI
(table + RLS live; surface with employee portal Phase 10).

## Phase 3.5 Sprint C log (2026-08-07)

**Brand & rules (owner directives):**
- **Icons-never-emojis rule** added to CLAUDE.md conventions; full sweep of
  ops + packages/ui replaced every emoji with lucide icons (Bell, Clock,
  AlertTriangle, Trophy, Check, X, FileText, Users, Globe, KanbanSquare…).
- AGMA logo (logo.svg) now brands the ops header, login, and reset pages;
  favicon-agma.webp set as the ops favicon.

**Security (C3):**
- Security headers via shipped .htaccess on BOTH sites (HSTS, nosniff,
  frame policies, Permissions-Policy, CSP scoped to self + Supabase;
  ops additionally DENY-framed + noindex).
- Rate limiting on lead-intake: pg `check_rate_limit()` (migration
  20260807090000), 5/hour per caller via salted IP hash — no raw PII stored.
- tsbuildinfo artifacts removed from git.

**Observability (C2):**
- `client-errors` edge function (deployed): browser error sink → Supabase
  function logs; rate-capped, PII-free, Zod-validated. Ops installs window
  error + unhandledrejection reporters (10/session cap). Sentry remains the
  documented upgrade path when volume justifies it.

**Testing (C1):**
- **RLS persona harness**: supabase/tests/rls_checks.sql + scripts/rls-check.sh
  — client/executor/strategist/anon visibility, internal_label column denial,
  audit_log denial, website consent gate, documents immutability. Green.
- **Playwright e2e** (apps/ops/e2e): full golden path — login → forced MFA
  enrollment completing with a REAL computed TOTP → pipeline → validated lead
  creation → search → documents → team roster. Green in 14s. Idempotent
  fixtures via local admin API.
- **Quality workflow** (.github/workflows/quality.yml): spins the full local
  Supabase stack in CI, runs the RLS harness + e2e on staging pushes/PRs,
  uploads traces on failure.

**Ops (C4):**
- backup.yml: weekly schema+data dumps as 90-day artifacts (secrets already
  configured for Migrate).
- uptime.yml: 30-min probes of all three sites + lead-intake preflight;
  failures email via GitHub notifications. WhatsApp alerting lands Phase 6.

**Deferred from C (honest):** lint gate re-enable (marketing's inherited code
needs a cleanup pass first) · bundle-size check · PR-based flow (single-
operator repo; revisit when a second contributor joins).

## Phase 3.5 Sprint B log (2026-08-07)

**Functionality half (docs/08):**
- Migration `20260807080000`: **activities engine** (global reminders table,
  linkable to leads/clients/documents), leads gain value/expected_close/
  outcome(won|lost)+lost_reason/tags/utm, clients gain tags, realtime
  publication on leads+documents+activities.
- **Pipeline discipline**: next-action chip on every card («⚠ لا خطوة تالية»
  when an open deal has no scheduled step — the Pipedrive rule), pipeline
  value badge, deal value on cards, win/loss with reasons, tags, next-step
  quick-add inside the lead editor, activities bell with overdue count +
  quick-add + mark-done.
- **UTM attribution**: marketing form captures utm_*+referrer → leads.utm.
- **Quote depth**: two-scenario pricing UI (★ recommended), item reordering,
  «نسخة جديدة» supersede flow with version badges.

**UX half (docs/07):**
- **Realtime**: postgres_changes → query invalidation (leads/documents/
  activities live across teammates).
- **TOTP 2FA enforced for team roles** (docs/05 §B11.4): forced enrollment on
  first login (QR + secret), challenge on later logins; self-heals orphaned
  unverified factors. Verified END-TO-END locally (enrolled + computed TOTP +
  reached aal2). Local config: [auth.mfa.totp]; hosted: check dashboard.
- **Auth lifecycle**: /reset page (request + set modes), invite-user edge
  function (admin-only, role stamping), الفريق team page (invite + role管理).
- **AR/EN chrome toggle** (i18n provider, localStorage persisted, direction
  flips; documents remain Arabic-primary).
- **Mobile**: bottom tab nav + responsive paddings.
- **Contrast**: gray-medium token lifted #737373→#8A8A8A (WCAG AA on ink).

**Bugs found & fixed while smoke-testing:** stale session for a deleted user
hung the shell (now force-signs-out) · StrictMode double-enroll · orphaned
unverified MFA factors blocking re-enrollment.

**Owner notes:** SETUP.md gains two items — confirm hosted MFA/TOTP enabled,
and configure custom SMTP before inviting the team (invites/resets email).

## Phase 3.5 Sprint A log (2026-08-07)

**Built (the 3→7 foundation):**
- **packages/ui**: 16-component design system — Input/Textarea/Select/Checkbox/
  Switch with FormField chrome (label+error+hint, aria-invalid), Button
  (loading + ghost + sizes), Badge, Spinner, Skeleton(+List), EmptyState,
  Modal (esc/backdrop/focus), ConfirmDialog (busy-guarded), Toast system
  (aria-live), Tabs, Table/Tr/Td. All RTL-first, focus-visible rings.
- **Zod everywhere**: packages/db/schemas.ts (lead/client/contact/interaction/
  scope/quote-draft, Arabic messages) used by ops forms with inline errors;
  lead-intake edge function rewritten on zod (mirrored — deno can't import
  the workspace package).
- **Data layer**: TanStack Query + typed hooks (lib/queries.ts), optimistic
  lead-stage moves with rollback, global mutation error→toast, skeletons.
- **Pipeline**: true drag-and-drop Kanban (dnd-kit, pointer+keyboard sensors,
  drag overlay, drop highlight) + stage select fallback in the edit modal
  (touch/screen-reader path); lead search; convert-to-client behind
  ConfirmDialog; empty state.
- **Navigation**: ⌘K global search (leads/clients/documents), client deep
  links (/clients/?id= survives refresh, Suspense-wrapped for static export),
  documents type/status filters, skip-link, aria-current nav.
- **Safety UX**: ConfirmDialogs on finalize/void/consent-withdrawal;
  disabled-with-reason buttons; success/error toasts on every mutation.

**Found & fixed:** Tailwind v4 doesn't scan workspace packages — `@source
"../../../packages/ui/src"` in ops globals.css or ui classes silently vanish.

**Verified:** full visual smoke on local stack (login → seeded pipeline →
stage move via fallback + optimistic update + toast → documents filters/empty
state) · builds · typechecks · 22 tests green.

**Remaining for 9+:** Sprint B (realtime, EN toggle, auth lifecycle + 2FA,
mobile, quote-builder depth, WCAG contrast) · Sprint C (e2e, RLS harness in
CI, Sentry, rate limiting, security headers, backups, PR flow + lint gate).

## Phase 3 log (2026-08-07)

**Built:**
- Migration `20260807060000_legal_documents`: `documents` (immutable after
  finalization — DB triggers block payload changes and deletes, status moves
  forward only), `document_counters` with atomic gapless
  `next_document_number()` (seeded Q=55, INV=53, CN=1 per docs/06 §3.1;
  strategist+ only, counters table reachable only through the function),
  `clause_library` seeded with the docs/06 §3.5 default commercial clause set.
- **packages/legal-templates**: entity constants (docs/06 §1/1b), palette
  sampled from the reference PDF, deterministic HTML renderers:
  `renderQuote` reproduces quotation-00054 anatomy (RTL dark sidebar with
  recipient/project/payment details, عرض سعر display title, numbered item
  cards with strikethrough discounts, named discounts, option pills with ★,
  reserved VAT row «—», footer strip, Arabic page numbers, closing line) and
  `renderContract` (NDA/SoW/SLA/MSA/AMC/COC family).
- **22 unit tests** incl. golden reproduction of reference 00054 totals
  (net 6,620), determinism, VAT-off row, internal_label leak guard, HTML
  escaping. Wired into CI (`pnpm test`).
- **apps/ops → المستندات**: quote builder (client, items with discounts,
  named discount, payment-account selector defaulting to Main, clause picker,
  live preview iframe), finalize = atomic Q-number + status sent + frozen
  payload, status transitions (sent→signed→active / void), print-to-PDF via
  browser print.

**Verified locally:** migration replay · Q-00055→Q-00056 sequential issue ·
immutability guard blocks tamper + delete on finalized docs · all builds,
typechecks, tests green.

**Deferred/notes:**
- Invoices + credit notes (INV/CN counters already live) land in Phase 5
  Finance with ZATCA fields behind the vat_enabled flag.
- Contract builder UI is minimal v1 (create via quote builder patterns);
  richer per-type variable forms with Phase 5/7 integrations.
- PDF is via browser print (deterministic HTML is the artifact of record);
  server-side PDF rendering can come with the notifications phase if needed.
- Page 2 (تفاصيل الخدمات per-item checklists) renders when payload provides
  details — builder UI field for it TBD.

**Manual test list:**
1. ops → المستندات → + عرض سعر: build a quote for a client, preview —
   compare against docs/references/quotation-00054.pdf side by side.
2. حفظ كمسودة → اعتماد وترقيم → number must be **Q-00055**.
3. Try another → Q-00056 (gapless, sequential).
4. Print preview → A4 layout, sidebar + footer intact.
5. Confirm a finalized quote's items can no longer be edited (immutable).

## Phase 2 log (2026-08-07)

**Built:**
- Migration `20260807030000_crm_website_sync`: `contacts`, `interactions`
  (docs/04 §2.1) + `website_clients` (docs/05 §B1) with the consent kill
  switch — anon read policy requires `published AND consent_public`, and
  withdrawing consent force-unpublishes in the ops UI. Also: service_role
  DML grants across all public tables (same image gap as Phase 1's
  authenticated grants, surfaced as 42501 in the edge function).
- Edge function **lead-intake** (deployed to production): validates + honeypot,
  CORS locked to agma.com.sa/staging/localhost, inserts leads with source=site.
  `verify_jwt=false` (public form endpoint).
- **apps/ops** (ops.agma.com.sa, static export SPA): Supabase auth gate (team
  roles only — client accounts blocked), 6-stage pipeline Kanban with lead
  create/stage moves/convert-to-client, clients workspace (contacts +
  interactions log), scope builder over the 32-service catalog with SoW draft
  preview (docs/06 §3.5 default terms) + send-for-approval (creates approvals
  row), website sync manager.
- **apps/marketing**: lead form now posts to lead-intake (WhatsApp path kept as
  fallback on failure); `ClientLogos` section on homepage renders published
  clients — invisible while empty, so zero visual change until first publish.

**Verified locally:** full db reset replay · anon RLS on website_clients
(kill switch confirmed) · lead-intake end-to-end (insert, honeypot, validation)
· production function smoke-tested (honeypot + CORS, no junk data) · all
builds + typechecks green.

**Owner to-do (SETUP.md Phase 2 additions):** env vars on both marketing
deployments + redeploy · create ops.agma.com.sa deployment · create first
team user + promote to admin. **All completed 2026-08-07** (admin:
abdulrahman.elibrahim@gmail.com). Supabase public config additionally
hardcoded as env fallback (Hostinger static builds don't receive env vars).

**Post-deploy incident (2026-08-07, resolved):** sites appeared stale after
deploys. Root causes: (1) Hostinger CDN edge served old assets and its
flush didn't purge → **CDN disabled on all three sites** (SETUP.md §2);
(2) verification-script false negatives (compressed responses + a marker
string that JSX splits across elements). Origin + on-disk builds were
verified current via SSH. agma.com.sa confirmed serving Phase 2 code.

**Manual test list (after owner to-do):**
1. Submit the contact form on agma.com.sa → lead appears in ops pipeline
   (stage: مكالمة استكشافية, source: الموقع).
2. Log in to ops.agma.com.sa with the admin account; client account should be
   rejected.
3. Move a lead across stages; convert at خارطة الطريق stage → client created.
4. Client detail: add contact + log interaction; build a scope (services from
   catalog), check SoW preview, save draft, send for approval.
5. Website page: enable a client, toggle consent + publish → logo/name appears
   on agma.com.sa homepage (section auto-appears); withdraw consent →
   disappears and publish toggle clears.

**Decisions/notes:**
- **Supabase GitHub integration is NOT applying migrations** (discovered
  2026-08-07; Phase 1+2 reached production via manual `supabase db push`).
  **Resolved:** `.github/workflows/migrate.yml` now runs `db push` on every
  merge to main touching supabase/ (idempotent via migration tracker; also
  manually triggerable via workflow_dispatch). Secrets configured; verified
  green end-to-end (run Migrate #2, 2026-08-07). Owner still to disconnect
  the defunct Supabase GitHub integration. Local `db reset` verification
  before merge remains mandatory (CLAUDE.md rule 7).
- Logos are URL-based v1 (paste a URL in ops). Proper upload to R2/Storage
  lands with the DAM (docs/04 §3.4). R2 bucket still pending in SETUP §4.
- Rate limiting on lead-intake is honeypot-only v1; add per-IP limits when
  the notifications phase introduces infra for it.
- WhatsApp webhook intake (docs/02 §3.1) deferred to Phase 6 (needs Twilio).

## Phase 1 log (2026-08-07)

**Built (3 migrations + packages/db):**
- `20260807010000_roles_profiles`: user_role enum (admin/strategist/executor/client),
  `profiles` on auth.users with auto-create trigger, security-definer RLS helpers
  (`app_role`, `is_admin`, `is_strategist_plus`, `is_team`, `current_client_id`,
  `is_project_member`), `role_profiles` (5 seeded incl. Key Accounts Manager)
- `20260807010100_core_schema`: full docs/02 §2 model — service_categories,
  services_catalog, clients, leads, scopes, roadmaps, projects, sprints, tasks,
  metrics, reports, approvals (with server-side decision stamping), messages +
  docs/03 playbook engine (playbooks, playbook_stages, task_templates,
  kpi_definitions). RLS + audit trigger on every table; explicit table grants.
- `20260807010200_catalog_seeds`: 8 categories · 32 services (AR names from live
  site) · 8 playbooks · 36 stages · 113 task templates (26 client-approval
  gates) · 31 KPI definitions · 5 role_profiles
- `packages/db`: generated Database types, typed client factory, stage/phase constants

**Verified locally (db reset from zero + persona tests):**
- RLS matrix matches docs/02 §4 exactly: client sees only own rows (draft scopes
  hidden); executor sees only assigned projects, no leads; strategist sees all;
  audit_log denied to everyone below service_role.
- Found + fixed: this Postgres image's default privileges give `authenticated`
  no DML — every table needs explicit grants alongside policies. **Rule for all
  future migrations: policy + grant, always both.** (Phase 0's flags read policy
  had the same latent gap; grant added here.)

**Decisions/notes for owner:**
1. Catalog divergence: site's AI page shows 4 services (incl. LLM Integration);
   docs/03 canon is 5 (AI agents, workflow automation, chatbots, GEO, predictive
   analytics) — seeded per docs/03. Reconcile when Phase 2 wires website sync.
2. Playbook modes: ai-automation=milestone, pr-media=recurring (docs/03 leaves
   these two unassigned) — flip in `playbooks.mode` if wrong.
3. task_template default_days are starting estimates — tune in ops UI later.
4. First admin user: after signing up in the portal/ops app, promote via
   `update profiles set role='admin' where email='...'` (service role).

**Phase 2 will:** CRM + Sales pipeline UI in apps/ops (Kanban per docs/02 §3.1),
lead intake from the site contact form, scope builder → SoW draft, website
live-sync (website_clients + consent_public kill switch per docs/05 §B1).

## Phase 0 log (2026-08-06)

**Built:**
- pnpm workspaces + Turborepo monorepo (`apps/*`, `packages/*`)
- Site export migrated to `apps/marketing` (`git mv` — history preserved), design 1:1:
  - `output: 'export'` + `images.unoptimized` (Hostinger static, Path 1 docs/05 §A1)
  - Removed unused AI Studio leftovers: `@google/genai`, `firebase-tools`,
    `postcss-import`, `next start/clean` scripts, picsum image config, HMR webpack hack
  - `eslint-config-next` aligned to Next 15; favicon renamed `favicon-agma.webp` (was spaced)
- `packages/ui`: `tokens.ts` + `tokens.css` (web palette from live site, document palette
  from docs/06 §2, typography, spacing, radii) + base `Button`/`Card` matching site styles.
  Marketing app intentionally NOT rewired to it yet (no-redesign rule).
- `supabase/`: config + env workflow README + migration `20260806120000_core_foundation`:
  `audit_log` (append-only) · generic `audit_trigger()` for all future tables ·
  `set_updated_at()` · `flags` (seeded `vat_enabled=false`) · `payment_accounts`
  (3 IBANs seeded from docs/06, single-default index, IBAN format check,
  `internal_label` excluded via column-level grants, RLS on everything)
- `.github/workflows/deploy.yml`: staging/main → Hostinger rsync-over-SSH, secrets
  via GitHub environments
- `SETUP.md`: full owner checklist (Hostinger SSH, Supabase ×2, R2, Twilio ⏳,
  SendGrid, AI keys, company-data verification)

**Stubbed / deferred:**
- `apps/ops`, `apps/portal`, `packages/db|ai-router|notifications|legal-templates|zatca`
  — directories not created until their phases (kickoff scope)
- Supabase Edge Functions dir empty; migrations not yet applied to hosted projects
- Marketing lead form is UI-only (no backend) — wired to Supabase in Phase 2
- CI migration step deferred to Phase 1 (needs `SUPABASE_ACCESS_TOKEN`)

**Decisions needed (owner):**
1. GitHub push access: local credential `aelibrahim-a11y` lacks rights on
   `apex-dandashi/AGMA-os` → add collaborator or switch credential.
2. Document palette exact values (cream/brown) are provisional in `packages/ui` —
   sample from reference PDFs before Phase 3 generators.
3. EN toggle for marketing site: CLAUDE.md rule 8 requires AR+EN; site is AR-only
   today. Propose scheduling with Phase 2 website-sync work.
4. Supabase region choice + PDPL data-residency note — Mumbai `ap-south-1`
   recommended (no Middle East region offered); confirm once projects are created.

**Decisions made (owner, 2026-08-06):**
- Twilio WhatsApp: dedicated Saudi number purchased later; sender activation deferred
  until the OS build completes. Phase 6 develops against the Twilio sandbox; only
  Meta Business verification starts early (it is the true lead-time item).
- **Single Supabase project** (`agma-os-production`) instead of staging+production.
  CLAUDE.md rule 7 amended: migrations proven on the local Supabase stack before
  `db push`; destructive migrations need explicit owner OK; feature flags isolate
  the staging site from client-visible changes. Region: Mumbai `ap-south-1`.
- PITR add-on declined (cost). Daily Pro backups (7-day retention) are the current
  recovery layer; weekly logical dump + R2→B2 mirror scheduled for a later phase.
- Supabase GitHub integration ON (merge to `main` → auto `db push`); automatic
  preview branching OFF. Consequence: local `supabase db reset` verification must
  pass BEFORE the first push of `main` to GitHub. (Verified 2026-08-06: replay
  clean, seeds + audit trigger + internal_label column denial all confirmed;
  main + staging pushed.)
- Website deploys via **Hostinger Git integration** (not GitHub Actions):
  `staging` branch → staging.agma.com.sa now; `main` → agma.com.sa at cutover,
  after visual verification of staging. Old AGMA-Web repo keeps serving
  production until then. deploy.yml replaced by ci.yml (build check only).
- pnpm pinned to **11.20.0** (Hostinger's Node 22 builder ships pnpm 11 and
  ignores older pins). Lockfile rebuilt under pnpm 11's release-age policy;
  sharp + unrs-resolver allowlisted in allowBuilds.

**Phase 1 will:** full schema + RLS for CRM/projects/finance domains, auth with roles
(admin/staff/client), seeds (32 services, 8 playbooks, roles, role_profiles),
`packages/db` with typed client + seed files, audit triggers on every new table,
CI migration step.

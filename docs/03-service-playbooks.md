# AGMA OS — Service Playbooks
**Tailored delivery workflows for the 8 categories / 32 services | v1.0 — August 2026**

This replaces generic "projects + tasks" with service-specific engines. Creating a project auto-loads its category playbook: stages, task templates, KPIs, and client approval gates. Structure below maps directly to seed data.

**Schema additions:**
```
playbooks        → id, category, name_ar
playbook_stages  → id, playbook_id, method_phase (A/G/M/A), name, order
task_templates   → id, stage_id, title, role, default_days, needs_client_approval
kpi_definitions  → id, playbook_id, key, label_ar, unit, direction (up/down)
```

---

## 1. الذكاء الاصطناعي والأتمتة — AI & Automation
*Services: AI agents, workflow automation, chatbots, GEO, predictive analytics*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Process audit | Map manual/repetitive workflows, quantify hours spent, pick automation targets |
| Analyze | Feasibility | Data access check, tool selection, ROI estimate |
| Generate | Build | Agent/bot/flow development, prompt & logic design, internal testing |
| Market | Deploy | Staging → client UAT → production rollout, team training |
| Adapt | Monitor & scale | Accuracy tracking, edge-case fixes, expand to next process |

**Approval gates:** automation targets list → UAT sign-off → production go-live.
**KPIs:** hours saved/month ↑, task accuracy % ↑, processes automated ↑, response time ↓.
**Deliverables:** process map, deployed system, admin guide (Arabic), monthly accuracy report.

---

## 2. التسويق الأدائي والإعلانات — Performance Marketing
*Services: paid social, Google Ads, programmatic, CRO*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Account & audience audit | Pixel/tracking check, audience segments, competitor ad intel |
| Generate | Campaign build | Creative production, copy variants, campaign structure, landing alignment |
| Market | Launch | Budget pacing setup, A/B structure live, tracking verified |
| Adapt | Optimize (weekly cycle) | Kill weak variants, scale winners, budget reallocation, CRO tests |

**Approval gates:** media plan + budget → creatives → scaling decisions above X% budget shift.
**KPIs:** CPA ↓, ROAS ↑, CTR ↑, conversion rate ↑, spend vs. budget.
**Deliverables:** media plan, live campaigns, weekly optimization log, monthly performance report.
**Cadence note:** this playbook runs *weekly* Adapt cycles — the dashboard must support week-over-week deltas.

---

## 3. السيو والمحتوى — SEO & Content
*Services: SEO audit, Arabic SEO, AI content production, creative copywriting*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Full audit | Technical crawl, Arabic keyword research, competitor gap analysis |
| Analyze | Content strategy | Topic clusters, content calendar, GEO (AI-engine visibility) targets |
| Generate | Production | AI-drafted + human-edited articles, on-page fixes, internal linking |
| Market | Publish | CMS publishing, indexing, distribution |
| Adapt | Rank & refresh | Rank tracking, content refresh queue, new cluster expansion |

**Approval gates:** keyword/topic plan → content calendar → monthly content batch.
**KPIs:** organic traffic ↑, keyword rankings (top-10 count) ↑, AI-engine citations ↑, indexed pages ↑.
**Deliverables:** audit report, keyword map, monthly content batch, quarterly rank report.
**Cadence note:** monthly production batches; rankings reported monthly, refreshed quarterly.

---

## 4. السوشال ميديا والمجتمعات — Social & Communities
*Services: account management, influencer marketing, social strategy, community management*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Presence audit | Account health, audience analysis, competitor benchmarking, voice definition |
| Generate | Content calendar | Monthly calendar, design + copy production, influencer shortlist |
| Market | Publish & engage | Scheduled posting, daily community engagement, influencer activations |
| Adapt | Review | Engagement analysis, format experiments, next month's calendar informed by data |

**Approval gates:** strategy & voice → monthly calendar (single batch approval) → influencer selections.
**KPIs:** engagement rate ↑, follower growth ↑, reach ↑, response time ↓, influencer ROI.
**Deliverables:** strategy doc, monthly calendar, published content, monthly insights report.
**Cadence note:** hard monthly rhythm — calendar approved by the 25th of the prior month. Portal nudges are critical here.

---

## 5. الهوية والتصميم الإبداعي — Branding & Creative
*Services: brand strategy, logo & identity, brand guidelines, motion graphics, packaging/print*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Discovery | Brand questionnaire, market/competitor visual audit, positioning workshop |
| Generate | Concepts | 2–3 identity directions, client presentation |
| Generate | Refinement | Chosen direction developed, revision rounds (capped at 2) |
| Market | Delivery | Full guideline document, asset package, applications (print/motion) |
| Adapt | Extension | New applications as brand scales |

**Approval gates:** positioning → concept direction (pick 1 of 3) → final identity → guideline doc.
**KPIs:** on-time delivery, revision rounds used vs. cap, asset adoption.
**Deliverables:** strategy deck, identity system, brand guidelines (AR/EN), source files.
**Cadence note:** milestone-based, not sprint-based — the system must support fixed-scope projects with revision-round counters, unlike the recurring playbooks.

---

## 6. الويب والمنتجات الرقمية — Web & Digital Products
*Services: websites, e-commerce, UX design, landing pages & A/B testing*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | UX discovery | User flows, sitemap, tech requirements, performance targets |
| Generate | Design | Wireframes → UI design → client review |
| Generate | Build | Development, CMS/store setup, content entry, QA (devices + speed) |
| Market | Launch | DNS/hosting, analytics + pixel install, go-live checklist |
| Adapt | Optimize | A/B tests on landing pages, CRO iterations, maintenance |

**Approval gates:** sitemap & wireframes → UI design → pre-launch UAT → go-live.
**KPIs:** page speed (LCP) ↓, conversion rate ↑, A/B test velocity, uptime.
**Deliverables:** design files, live site/store, admin training, post-launch optimization log.

---

## 7. الاستراتيجية والاستشارات — Strategy & Consulting
*Services: full marketing strategy, digital/AI transformation consulting, market research*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Research | Market research, competitor analysis, internal capability assessment |
| Generate | Strategy build | Positioning, channel mix, budget model, transformation roadmap |
| Market | Handover | Strategy presentation, execution briefing (internal teams or client's) |
| Adapt | Quarterly review | KPI review vs. plan, strategy adjustments |

**Approval gates:** research findings → strategy document → quarterly revisions.
**KPIs:** roadmap milestones hit, strategy-to-execution conversion (did it become projects?).
**Deliverables:** research report, strategy document, roadmap, quarterly review memos.
**Cadence note:** often the *entry* project — completing it should trigger scope proposals for other categories inside the pipeline module.

---

## 8. العلاقات العامة والإعلام — PR & Media
*Services: PR & media management, media buying, event marketing*

**Workflow:**
| Phase | Stage | Key tasks |
|---|---|---|
| Analyze | Reputation audit | Media presence scan, sentiment, media list building |
| Generate | Messaging | Press materials, story angles, event concepts, media plan |
| Market | Execute | Press outreach, media buys, event activation |
| Adapt | Measure | Coverage tracking, sentiment shift, event ROI |

**Approval gates:** messaging & media list → media buy budget → event concept.
**KPIs:** media mentions ↑, sentiment score ↑, share of voice ↑, event attendance/leads.
**Deliverables:** media kit, coverage report, event debrief.

---

## How this changes AGMA OS

1. **Project creation flow:** pick client → pick category → playbook auto-loads stages + task templates with default durations and assignee roles. Zero blank-page setup.
2. **Two project types emerge:** *recurring* (performance, social, SEO — monthly/weekly cycles) and *milestone* (branding, web, strategy — fixed scope, revision caps). The delivery module needs both modes.
3. **KPI definitions are per-playbook**, so each client dashboard shows only relevant metrics — a branding client never sees an empty ROAS widget.
4. **Approval gates are data**, not convention: tasks flagged `needs_client_approval` auto-appear in the portal queue with the WhatsApp nudge cycle.
5. **Cross-sell hook:** Strategy playbook completion auto-drafts scope proposals for the categories its roadmap recommends.

---
*AGMA™ internal — pairs with AGMA-OS-System-Spec.md*

# AGMA — Brand & Document Standards
**Extracted from production references: Quotation 00054, Invoice 00052, employee welcome email + signature | Aug 2026**

This file is the design contract for every generated document and email in AGMA OS. Reference PDFs live in `/packages/legal-templates/references/`.

---

## 1. Entity constants (single source of truth → `config/company.ts`)

| Key | Value |
|---|---|
| Legal name (AR) | مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية |
| Brand name | AGMA · جيل الذكاء الاصطناعي |
| CR (السجل التجاري) | 1009127528 |
| Tax number (الرقم الضريبي) | 313630147 |
| Postal code | 12837 · Riyadh |
| Web | www.agma.com.sa |
| Phone | +966 58 119 5387 |
| Emails | care@agma.com.sa (documents) · hello@agma.com.sa (general) |
| Bank | مصرف الراجحي — accounts via `payment_accounts` table (see below), never hardcoded per document |

### Payment accounts — selector feature
Documents (quotes/invoices) include a **bank account selector**; the chosen account renders in the payment sidebar. **Client-facing beneficiary is ALWAYS the establishment name — internal labels are never rendered on any document.** Seed data:

| # | IBAN | Beneficiary shown to client | Internal label (system only) |
|---|---|---|---|
| 1 | SA3880000296608016343793 | مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية | Main (**default**) |
| 2 | SA3880000296608016343769 | مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية | For A.Alghamdi |
| 3 | SA4780000001608016057099 | مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية | For A.Elibrahim |

Retired: SA27 8000 0296 6080 1554 1413 (one-time use on invoice 00052) — do **not** seed; keep only as a historical reference on that invoice record.

Rules: main account pre-selected by default; `internal_label` is an admin-only field excluded from all rendered outputs and the client portal; selection logged per document (audit); Finance reports can group revenue by account label for partner-level tracking.

## 1b. Official registrations (from MoC certificate → `config/company.ts` + compliance tracker)

| Registration | Value |
|---|---|
| Unified establishment number (الرقم الموحد) | 7042355441 |
| Commercial Registration (branch) | 1009127528 — expiry **1447/05/11H** |
| Main center CR | 1009124211 |
| Registered address | 7806، يوسف بن مصامد، 5084 — الرياض 12837 |
| Capital | 5,000 SAR |
| Owner / authorized manager | عامر عبدالله بن عثمان الغامدي |
| ZATCA (الزكاة والضريبة) | 313630147 |
| GOSI · HRSD · SPL | Linked per certificate — transcribe exact numbers from original PDF into config (scan quality; verify digits) |
| Chamber of Commerce | **تحت الإجراء** (in progress — track to completion) |
| Balady license | لا يوجد (not required for activity — confirm once with accountant) |

**Compliance tracker (add to Legal module):** table of government registrations with expiry/renewal dates + notification-engine alerts at 60/30/7 days. First entries: CR expiry 1447/05/11H, chamber membership completion, ZATCA wave applicability check. The Ministry's verification QR (qr.mc.gov.sa) link stored per record.

## 2. Visual identity (→ `packages/ui/tokens.ts`)

- **Palette:** AGMA orange (primary accent, headers, totals highlight), near-black brown (sidebar panels, dark blocks), cream/beige paper background, white content cards. Orange circular ring motif top-left of documents.
- **Layout DNA (documents):** right dark sidebar (RTL) holding logo + recipient (موجَّهة إلى) + project + payment details; huge Arabic display title (عرض سعر / فاتورة); document number in large numerals with issue date + city; numbered line items (01, 02…) in cards with service name, description line, and SAR amount; totals block with dark pill (option 1) + orange pill (highlighted option/final); footer strip with legal entity + CR + tax + contacts on every page; page numbers in Arabic numerals (صفحة ٠١ / ٠٣).
- **Document anatomy:** Page 1 = summary + items + totals · Page 2 = تفاصيل الخدمات (per-item technical breakdown with ✓ checklists, renewal-cost callout) · Page 3 (quotes) = الشروط والاعتماد (payment terms, timeline bar, optional add-ons, general terms, dual signature blocks + agency stamp).
- **Signature closing line:** «بإذن الله إلى تعاونٍ مثمر» — keep on all client documents.
- **Typography:** Arabic-first; Latin only for technical terms (WordPress, SSL, DNS, Hostinger). Bilingual numerals as in references.

## 3. Document conventions the generators must honor

1. **Numbering:** references show a shared sequence (invoice 00052, quote 00054). For ZATCA readiness, split into prefixed sequences — `Q-000XX` quotations, `INV-000XX` invoices, `CN-000XX` credit notes — continuing from current counters. Sequential, gapless, no deletions.
2. **VAT:** both references show ضريبة القيمة المضافة = «—» (not VAT-registered yet; the 9-digit tax number is not a 15-digit VAT registration). Finance module ships with **VAT-off mode** matching current reality, plus a config flag that flips to 15% VAT + ZATCA fields the day registration lands — templates already reserve the row.
3. **Discount pattern:** named discounts on quotes (e.g., «خصم مصطفى 50%») with original-price strikethrough logic (القيمة الأصلية × خصم). Keep as a `discount_label` field.
4. **Options pattern:** quotes support Option 1 / Option 2 totals (e.g., hosting variants) with a ★ recommended marker — generator supports up to 2 priced scenarios.
5. **Payment terms:** default 50% signing / 25% design approval / 25% delivery; 30-day quote validity; IP transfers on full payment; agency retains unapproved concepts + portfolio rights unless waived in writing; out-of-scope priced separately. These become the default clause set in the Legal suite.
6. **Recurring-cost callout:** invoices with subscriptions show «التكلفة السنوية بعد السنة الأولى» renewal block — generator computes this automatically from line items flagged `recurring`.

## 4. Employee comms (→ employee portal templates)

The welcome announcement email + HTML signature for the Key Accounts Manager are the production templates — parameterize, don't redesign:
- **Announcement email:** dark header with AG mark + "TEAM ANNOUNCEMENT", circular photo in orange ring, orange "WELCOME TO AGMA" eyebrow, name + role, body paragraph, three role-pillar cards (black/orange/black) auto-filled per role from HR, contact row (email/phone/location), orange CTA button, dark footer.
- **HTML signature:** orange top rule, circular photo with orange ring, name + role in orange caps, two-column contact grid with orange/black icon chips (phone, email, web, location), AG mark right, confidentiality line. Email pattern: `FirstName.LastInitial@agma.com.sa`.
- Both generated by the employee portal on HR record creation, with role-pillar copy pulled from a `role_profiles` table.

## 5. Current team reference
- Abdulkarim El Jabakhanji — Key Accounts Manager — Abdulkarim.J@agma.com.sa — +966 55 964 6354 (first record for the HR seed).

---
*Add to repo root alongside CLAUDE.md; reference PDFs are the visual ground truth for generator QA.*

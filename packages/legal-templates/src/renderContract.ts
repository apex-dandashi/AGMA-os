import { COMPANY, DOC_COLORS, toArabicDigits } from './company';
import type { ContractPayload } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Contract renderer (NDA / SoW / SLA / MSA / AMC / COC) — same visual family
 * as the quote: paper background, dark header band, clause cards, dual
 * signatures, closing line. Deterministic.
 */
export function renderContract(payload: ContractPayload): string {
  const c = DOC_COLORS;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${esc(payload.docTitleAr)} ${payload.number ?? ''}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic', 'Tajawal', -apple-system, sans-serif;
         background: ${c.paper}; color: ${c.ink}; }
  .page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto;
          padding: 0 0 30mm; background: ${c.paper}; }
  .band { background: ${c.ink}; color: #fff; padding: 12mm 14mm 10mm;
          border-bottom: 3mm solid ${c.accent}; }
  .band .ag { color: ${c.accent}; font-weight: 900; font-size: 24px; }
  .band h1 { font-size: 34px; font-weight: 900; margin-top: 4mm; }
  .band .meta { color: #cfc6bf; font-size: 11.5px; margin-top: 2mm; }
  .content { padding: 10mm 14mm; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 8mm; }
  .party { background: ${c.card}; border-radius: 2mm; padding: 5mm 6mm; }
  .party label { font-size: 10px; color: ${c.accent}; font-weight: 700; display: block; }
  .party b { font-size: 13px; }
  .party span { font-size: 10.5px; color: ${c.muted}; display: block; }
  .preamble { font-size: 12.5px; line-height: 2; margin-bottom: 6mm; }
  .clause { background: ; border-radius: 2mm; padding: 5mm 6mm; margin-bottom: 4mm; break-inside: avoid; }
  .clause h4 { color: ${c.accent}; font-size: 13px; margin-bottom: 1.5mm; }
  .clause h4 i { font-style: normal; color: ${c.muted}; font-size: 11px; }
  .clause p { font-size: 12px; line-height: 1.9; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 14mm; }
  .sig span { font-size: 11px; color: ${c.muted}; }
  .sig i { display: block; border-bottom: 1.5px solid ${c.ink}; height: 14mm; }
  .sig small { font-size: 10px; color: ${c.muted}; }
  .closing { text-align: center; margin-top: 12mm; font-size: 15px; font-weight: 700; color: ${c.accent}; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 5mm 14mm 6mm;
          border-top: 1px solid #d8cfc2; font-size: 9.5px; color: ${c.muted}; text-align: center; }
  .footer .contact { color: ${c.accent}; margin-top: 1.5mm; }
</style>
</head>
<body>
  <section class="page">
    <div class="band">
      <span class="ag">AG</span>
      <h1>${esc(payload.docTitleAr)}</h1>
      <div class="meta">${payload.number ? `رقم ${esc(payload.number)} · ` : ''}تاريخ الإصدار: ${esc(payload.issueDateAr)} · ${esc(payload.city)}</div>
    </div>
    <div class="content">
      <div class="parties">
        <div class="party"><label>الطرف الأول</label><b>${esc(payload.firstParty.name)}</b>
          ${payload.firstParty.descriptor ? `<span>${esc(payload.firstParty.descriptor)}</span>` : ''}</div>
        <div class="party"><label>الطرف الثاني</label><b>${esc(payload.secondParty.name)}</b>
          ${payload.secondParty.descriptor ? `<span>${esc(payload.secondParty.descriptor)}</span>` : ''}</div>
      </div>
      ${payload.preamble ? `<p class="preamble">${esc(payload.preamble)}</p>` : ''}
      ${payload.clauses
        .map(
          (cl, i) => `
      <div class="clause"><h4><i>البند ${toArabicDigits(i + 1)} —</i> ${esc(cl.title)}</h4><p>${esc(cl.body)}</p></div>`
        )
        .join('')}
      <div class="signatures">
        <div class="sig"><span>الطرف الأول</span><i></i><small>${esc(payload.firstParty.name)}</small></div>
        <div class="sig"><span>الطرف الثاني</span><i></i><small>${esc(payload.secondParty.name)}</small></div>
      </div>
      <p class="closing">«${COMPANY.closingLine}»</p>
    </div>
    <div class="footer">
      <div>${COMPANY.legalNameAr} · السجل التجاري ${toArabicDigits(COMPANY.cr)} · الرقم الضريبي ${toArabicDigits(COMPANY.taxNumber)}</div>
      <div class="contact">${COMPANY.web} &nbsp;·&nbsp; ${COMPANY.phone} &nbsp;·&nbsp; ${COMPANY.emailDocuments}</div>
    </div>
  </section>
</body>
</html>`;
}

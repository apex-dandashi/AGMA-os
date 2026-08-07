import { COMPANY, DOC_COLORS, formatSAR } from './company';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface StatementRow {
  number: string;
  /** ISO date (YYYY-MM-DD). */
  issuedOn: string;
  kind: 'invoice' | 'credit_note';
  total: number;
  paid: number;
}

export interface StatementPayload {
  clientName: string;
  issueDateAr: string;
  rows: StatementRow[];
}

/**
 * كشف حساب العميل (docs/08 §3) — finalized invoices & credit notes with
 * paid/balance per row and closing totals. Same visual family as the
 * invoice. Deterministic.
 */
export function renderStatement(payload: StatementPayload): string {
  const c = DOC_COLORS;
  const invoiced = payload.rows.reduce(
    (s, r) => s + (r.kind === 'credit_note' ? -r.total : r.total), 0);
  const paid = payload.rows.reduce((s, r) => s + r.paid, 0);
  const balance = invoiced - paid;

  const rows = payload.rows
    .map((r) => {
      const rowBalance = (r.kind === 'credit_note' ? -r.total : r.total) - r.paid;
      return `
      <tr>
        <td dir="ltr">${esc(r.number)}</td>
        <td dir="ltr">${esc(r.issuedOn)}</td>
        <td>${r.kind === 'credit_note' ? 'إشعار دائن' : 'فاتورة'}</td>
        <td dir="ltr">${r.kind === 'credit_note' ? '−' : ''}${formatSAR(r.total)}</td>
        <td dir="ltr">${formatSAR(r.paid)}</td>
        <td dir="ltr" class="${rowBalance > 0 ? 'due' : ''}">${formatSAR(rowBalance)}</td>
      </tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>كشف حساب — ${esc(payload.clientName)}</title>
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
  .band h1 { font-size: 32px; font-weight: 900; margin-top: 4mm; }
  .band .meta { color: #cfc6bf; font-size: 11.5px; margin-top: 2mm; }
  .content { padding: 10mm 14mm; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { text-align: start; color: ${c.accent}; font-size: 11px;
             border-bottom: 1.5px solid ${c.ink}; padding: 2.5mm 2mm; }
  tbody td { padding: 3mm 2mm; border-bottom: 1px solid #d8cfc2; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  td.due { color: ${c.accent}; font-weight: 700; }
  .totals { margin-top: 8mm; margin-inline-start: auto; width: 70mm;
            background: ${c.card}; border-radius: 2mm; padding: 5mm 6mm; font-size: 12.5px; }
  .totals .row { display: flex; justify-content: space-between; padding: 1.5mm 0; }
  .totals .balance { border-top: 1.5px solid ${c.ink}; margin-top: 2mm; padding-top: 2.5mm;
                     font-weight: 900; color: ${balance > 0 ? c.accent : c.ink}; }
  .closing { text-align: center; margin-top: 12mm; font-size: 14px; font-weight: 700; color: ${c.accent}; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 5mm 14mm 6mm;
          border-top: 1px solid #d8cfc2; font-size: 9.5px; color: ${c.muted}; text-align: center; }
</style>
</head>
<body>
  <section class="page">
    <div class="band">
      <span class="ag">AG</span>
      <h1>كشف حساب</h1>
      <div class="meta">${esc(payload.clientName)} · حتى تاريخ ${esc(payload.issueDateAr)} · ${COMPANY.city}</div>
    </div>
    <div class="content">
      <table>
        <thead>
          <tr><th>الرقم</th><th>التاريخ</th><th>النوع</th><th>القيمة</th><th>المسدد</th><th>المتبقي</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="row"><span>إجمالي الفواتير</span><b dir="ltr">${formatSAR(invoiced)}</b></div>
        <div class="row"><span>إجمالي المسدد</span><b dir="ltr">${formatSAR(paid)}</b></div>
        <div class="row balance"><span>الرصيد المستحق</span><b dir="ltr">${formatSAR(balance)}</b></div>
      </div>
      <p class="closing">«${COMPANY.closingLine}»</p>
    </div>
    <div class="footer">
      ${COMPANY.legalNameAr} · س.ت ${COMPANY.cr} · الرقم الضريبي ${COMPANY.taxNumber}
      <div>${COMPANY.web} · ${COMPANY.emailDocuments} · ${COMPANY.phone}</div>
    </div>
  </section>
</body>
</html>`;
}

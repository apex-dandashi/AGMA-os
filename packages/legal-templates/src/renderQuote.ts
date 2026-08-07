import { COMPANY, DOC_COLORS, formatIBAN, formatSAR, toArabicDigits } from './company';
import { LOGO_DATA_URI } from './logo';
import { computeQuoteTotals } from './totals';
import type { QuotePayload } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Renders a quotation as a self-contained, print-ready HTML document that
 * reproduces the reference anatomy (quotation 00054): RTL, dark sidebar with
 * recipient/project/payment details, display title, numbered item cards,
 * totals with reserved VAT row, option pills, footer strip, closing line.
 * Deterministic: same payload → identical HTML (tested).
 */
export function renderQuote(payload: QuotePayload): string {
  const t = computeQuoteTotals(payload);
  const c = DOC_COLORS;
  const pages = payload.totalPages ?? 2;

  const items = payload.items
    .map(
      (item, i) => `
      <div class="item">
        <div class="num">${String(i + 1).padStart(2, '0')}</div>
        <div class="body">
          <h4>${esc(item.title)}</h4>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
          ${
            item.originalAmount && item.discountLabel
              ? `<p class="disc">القيمة الأصلية ${formatSAR(item.originalAmount)} ر.س × ${esc(item.discountLabel)}</p>`
              : ''
          }
        </div>
        <div class="amt"><b>${formatSAR(item.amount)}</b> <span>SAR</span></div>
      </div>`
    )
    .join('');

  const discountRows = payload.discounts
    .map(
      (d) => `
      <div class="trow"><span>${esc(d.label)}</span><b class="neg">– SAR ${formatSAR(d.amount)}</b></div>`
    )
    .join('');

  const optionPills = payload.options
    .map(
      (o) => `
      <div class="pill ${o.recommended ? 'pill-accent' : ''}">
        <span>${esc(o.label)}${o.recommended ? ' <b class="star">★</b>' : ''}</span>
        <b>SAR ${formatSAR(o.amount)}</b>
      </div>`
    )
    .join('');

  const clausePage =
    payload.clauses.length > 0
      ? `
  <section class="page">
    <h2 class="page-title">الشروط والاعتماد</h2>
    ${payload.clauses
      .map(
        (cl) => `
    <div class="clause"><h4>${esc(cl.title)}</h4><p>${esc(cl.body)}</p></div>`
      )
      .join('')}
    <div class="signatures">
      <div class="sig"><span>اعتماد العميل</span><i></i><small>${esc(payload.recipientName)}</small></div>
      <div class="sig"><span>عن ${COMPANY.brandAr}</span><i></i><small>${COMPANY.legalNameAr}</small></div>
    </div>
    <p class="closing">«${COMPANY.closingLine}»</p>
    ${footer(toArabicDigits('02'), toArabicDigits(String(pages).padStart(2, '0')))}
  </section>`
      : '';

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>عرض سعر ${payload.number ?? 'مسودة'}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'IBM Plex Sans Arabic', 'Tajawal', -apple-system, sans-serif;
         background: ${c.paper}; color: ${c.ink}; }
  .page { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto;
          background: ${c.paper}; overflow: hidden; page-break-after: always;
          padding: 14mm 12mm 30mm; }
  .ring { position: absolute; top: -22mm; left: -22mm; width: 62mm; height: 62mm;
          border: 9mm solid ${c.accent}; border-radius: 50%; opacity: .9; }
  .ring::after { content: ''; position: absolute; inset: 6mm; border: 5mm solid ${c.accentSoft};
          border-radius: 50%; }
  .sidebar { position: absolute; top: 0; right: 0; width: 62mm; min-height: 200mm;
          background: ${c.ink}; color: #fff; border-bottom-left-radius: 22mm;
          padding: 12mm 8mm 14mm; }
  .sidebar .brand { text-align: left; margin-bottom: 14mm; }
  .sidebar .brand b { display:block; font-size: 15px; text-align: right; line-height: 1.5; }
  .sidebar .brand .ag { color: ${c.accent}; font-weight: 900; font-size: 30px; letter-spacing: 1px; }
  .sidebar h5 { color: ${c.accent}; font-size: 11px; margin: 7mm 0 2mm; }
  .sidebar .who b { font-size: 14px; display: block; }
  .sidebar .who span, .sidebar .kv span { color: #cfc6bf; font-size: 10.5px; }
  .sidebar .kv { margin-top: 4mm; }
  .sidebar .kv label { display:block; color:#9b8f86; font-size: 9.5px; }
  .sidebar .kv b { font-size: 11.5px; }
  .sidebar hr { border: 0; border-top: 1px solid ${c.accent}; margin: 7mm 0; opacity:.8; }
  .sidebar .iban { direction: ltr; text-align: right; font-size: 11.5px; font-weight: 700;
          letter-spacing: .3px; }
  .main { margin-right: 68mm; padding-top: 4mm; }
  h1.display { font-size: 58px; font-weight: 900; letter-spacing: -1px; margin: 10mm 0 3mm; }
  .meta { display: flex; gap: 6mm; align-items: baseline; font-size: 12px; color: ${c.muted};
          border-bottom: 1px solid #d8cfc2; padding-bottom: 5mm; }
  .meta .no { font-size: 20px; color: ${c.ink}; font-weight: 800; }
  .meta .no i { font-style: normal; font-size: 26px; }
  .intro { background: #faf6ef; border-right: 3px solid ${c.accent}; padding: 5mm 6mm;
          margin: 6mm 0; font-size: 12.5px; line-height: 2; border-radius: 2mm; }
  .thead { display: grid; grid-template-columns: 1fr 30mm; gap: 4mm;
          background: linear-gradient(270deg, ${c.accent}, #f2703f); color: #fff;
          border-radius: 2mm; padding: 3mm 5mm; font-size: 12px; font-weight: 700; }
  .thead .left { text-align: left; }
  .item { display: grid; grid-template-columns: 12mm 1fr 30mm; gap: 4mm; align-items: center;
          background: ${c.card}; border-radius: 2mm; padding: 5mm; margin-top: 3mm;
          break-inside: avoid; }
  .item .num { font-size: 20px; color: ${c.muted}; font-weight: 300; text-align: center; }
  .item h4 { font-size: 14px; }
  .item p { font-size: 10.5px; color: ${c.muted}; margin-top: 1mm; }
  .item p.disc { color: ${c.accent}; font-weight: 600; }
  .item .amt { text-align: left; font-size: 16px; }
  .item .amt span { font-size: 9px; color: ${c.muted}; }
  .totals { display: grid; grid-template-columns: 1fr 62mm; gap: 8mm; margin-top: 10mm; }
  .trow { display: flex; justify-content: space-between; font-size: 12.5px; padding: 2mm 0; }
  .trow b { direction: ltr; }
  .trow .neg { color: ${c.accent}; }
  .trow.vat { border-top: 1px solid #d8cfc2; color: ${c.muted}; }
  .pill { display: flex; justify-content: space-between; align-items: center;
          background: ${c.ink}; color: #fff; border-radius: 10mm; padding: 4mm 7mm;
          margin-bottom: 4mm; font-size: 13px; }
  .pill b { font-size: 17px; direction: ltr; }
  .pill-accent { background: ${c.accent}; }
  .star { font-style: normal; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 5mm 12mm 6mm;
          border-top: 1px solid #d8cfc2; font-size: 9.5px; color: ${c.muted};
          text-align: center; background: ${c.paper}; }
  .footer .contact { color: ${c.accent}; margin-top: 1.5mm; }
  .footer .pageno { margin-top: 1.5mm; }
  .page-title { font-size: 34px; font-weight: 900; margin: 8mm 0; }
  .clause { background: ${c.card}; border-radius: 2mm; padding: 5mm 6mm; margin-bottom: 4mm; }
  .clause h4 { color: ${c.accent}; font-size: 13px; margin-bottom: 1.5mm; }
  .clause p { font-size: 12px; line-height: 1.9; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: 14mm; }
  .sig span { font-size: 11px; color: ${c.muted}; }
  .sig i { display: block; border-bottom: 1.5px solid ${c.ink}; height: 14mm; }
  .sig small { font-size: 10px; color: ${c.muted}; }
  .closing { text-align: center; margin-top: 12mm; font-size: 15px; font-weight: 700;
          color: ${c.accent}; }
  @media print { body { background: #fff; } .page { margin: 0; } }
</style>
</head>
<body>
  <section class="page">
    <div class="ring"></div>
    <aside class="sidebar">
      <div class="brand"><img src="${LOGO_DATA_URI}" alt="AGMA" style="height:11mm;width:auto" /></div>
      <h5>موجَّهة إلى</h5>
      <div class="who"><b>${esc(payload.recipientName)}</b>
        ${payload.recipientCompany ? `<span>${esc(payload.recipientCompany)}</span>` : ''}</div>
      <div class="kv"><label>المشروع</label><b>${esc(payload.projectName)}</b></div>
      ${
        payload.projectExtra
          ? `<div class="kv"><label>${esc(payload.projectExtra.label)}</label><b>${esc(payload.projectExtra.value)}</b></div>`
          : ''
      }
      <hr>
      <h5>بيانات الحوالة البنكية</h5>
      <div class="kv"><label>المستفيد</label><b>${esc(payload.paymentAccount.beneficiaryName)}</b></div>
      <div class="kv"><label>البنك</label><b>${esc(payload.paymentAccount.bankName)}</b></div>
      <div class="kv"><label>الآيبان</label><div class="iban">${formatIBAN(payload.paymentAccount.iban)}</div></div>
    </aside>
    <div class="main">
      <h1 class="display">عرض سعر</h1>
      <div class="meta">
        <span class="no">رقم · <i>${payload.number ? esc(payload.number.replace(/^Q-/, '')) : 'مسودة'}</i></span>
        <span>تاريخ الإصدار: <b>${esc(payload.issueDateAr)}</b></span>
        <span>${esc(payload.city)}</span>
      </div>
      ${payload.intro ? `<div class="intro">${esc(payload.intro)}</div>` : ''}
      <div class="thead"><span>الخدمات والمنتجات</span><span class="left">المبلغ</span></div>
      ${items}
      <div class="totals">
        <div>
          <div class="trow"><span>إجمالي الخدمات (قبل الخصم)</span><b>SAR ${formatSAR(t.gross)}</b></div>
          ${discountRows}
          ${payload.discounts.length ? `<div class="trow"><span>الخدمات بعد الخصم</span><b>SAR ${formatSAR(t.afterDiscount)}</b></div>` : ''}
          ${t.noDiscountTotal > 0 ? `<div class="trow"><span>بنود بدون خصم</span><b>SAR ${formatSAR(t.noDiscountTotal)}</b></div>` : ''}
          <div class="trow vat"><span>ضريبة القيمة المضافة</span><b>${payload.vatEnabled ? `SAR ${formatSAR(payload.vatAmount ?? 0)}` : '—'}</b></div>
        </div>
        <div>
          ${optionPills || `<div class="pill pill-accent"><span>الإجمالي</span><b>SAR ${formatSAR(t.net)}</b></div>`}
        </div>
      </div>
      ${footer(toArabicDigits('01'), toArabicDigits(String(pages).padStart(2, '0')))}
    </div>
  </section>
  ${clausePage}
</body>
</html>`;
}

function footer(pageAr: string, totalAr: string): string {
  return `
    <div class="footer">
      <div>${COMPANY.legalNameAr} · السجل التجاري ${toArabicDigits(COMPANY.cr)} · الرقم الضريبي ${toArabicDigits(COMPANY.taxNumber)} · الرمز البريدي ${toArabicDigits(COMPANY.postalCode)}</div>
      <div class="contact">${COMPANY.web} &nbsp;·&nbsp; ${COMPANY.phone} &nbsp;·&nbsp; ${COMPANY.emailDocuments}</div>
      <div class="pageno">صفحة ${pageAr} / ${totalAr}</div>
    </div>`;
}

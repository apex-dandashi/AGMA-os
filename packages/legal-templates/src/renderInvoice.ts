import { COMPANY, DOC_COLORS, formatIBAN, formatSAR, toArabicDigits } from './company';
import { zatcaQrSvg } from './zatca';
import type { PaymentAccountInfo, QuoteItem } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export interface InvoicePayload {
  /** INV-00053 / CN-00001 style — null while draft. */
  number: string | null;
  /** 'invoice' renders فاتورة; 'credit_note' renders إشعار دائن. */
  kind: 'invoice' | 'credit_note';
  issueDateAr: string;
  city: string;
  recipientName: string;
  recipientCompany?: string;
  projectName: string;
  /** Source doc reference (e.g. quote or the invoice a CN corrects). */
  relatedNumber?: string;
  items: QuoteItem[];
  vatEnabled: boolean;
  vatAmount?: number;
  paymentAccount: PaymentAccountInfo;
  /** Recorded payments — renders the paid/balance box. */
  paidAmount?: number;
  /** docs/06 §3.6 recurring-cost callout. */
  renewalNote?: string;
  dueDateAr?: string;
  /** ISO issue timestamp — when present on a numbered invoice, the ZATCA
   *  Phase-1 TLV QR renders (mandatory on Saudi tax invoices). */
  issuedAtIso?: string;
}

export function computeInvoiceTotal(items: QuoteItem[]): number {
  return items.reduce((s, i) => s + i.amount, 0);
}

/**
 * Invoice / credit-note renderer — same visual family as the reference
 * quotation (invoice-00052 anatomy): RTL sidebar with payment details,
 * فاتورة display title, numbered item cards, totals with reserved VAT row,
 * paid/balance box, footer strip. Deterministic.
 */
export function renderInvoice(payload: InvoicePayload): string {
  const c = DOC_COLORS;
  const total = computeInvoiceTotal(payload.items);
  const paid = payload.paidAmount ?? 0;
  const balance = total + (payload.vatEnabled ? payload.vatAmount ?? 0 : 0) - paid;
  const title = payload.kind === 'invoice' ? 'فاتورة' : 'إشعار دائن';
  const sign = payload.kind === 'credit_note' ? '−' : '';

  // ZATCA Phase-1 QR — only on issued (numbered) invoices with a timestamp.
  const zatcaQr =
    payload.kind === 'invoice' && payload.number && payload.issuedAtIso
      ? zatcaQrSvg({
          sellerName: COMPANY.legalNameAr,
          vatNumber: COMPANY.taxNumber,
          timestamp: payload.issuedAtIso,
          total: total + (payload.vatEnabled ? payload.vatAmount ?? 0 : 0),
          vat: payload.vatEnabled ? payload.vatAmount ?? 0 : 0,
        })
      : null;

  const items = payload.items
    .map(
      (item, i) => `
      <div class="item">
        <div class="amt"><b>${sign}${formatSAR(item.amount)}</b> <span>SAR</span></div>
        <div class="body">
          <h4>${esc(item.title)}</h4>
          ${item.description ? `<p>${esc(item.description)}</p>` : ''}
        </div>
        <div class="num">${String(i + 1).padStart(2, '0')}</div>
      </div>`
    )
    .join('');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${title} ${payload.number ?? 'مسودة'}</title>
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
  .sidebar { position: absolute; top: 0; right: 0; width: 62mm; min-height: 190mm;
          background: ${c.ink}; color: #fff; border-bottom-left-radius: 22mm;
          padding: 12mm 8mm 14mm; }
  .sidebar .brand { text-align: left; margin-bottom: 14mm; }
  .sidebar .brand b { display:block; font-size: 15px; text-align: right; line-height: 1.5; }
  .sidebar .brand .ag { color: ${c.accent}; font-weight: 900; font-size: 30px; }
  .sidebar h5 { color: ${c.accent}; font-size: 11px; margin: 7mm 0 2mm; }
  .sidebar .kv label { display:block; color:#9b8f86; font-size: 9.5px; }
  .sidebar .kv b { font-size: 11.5px; }
  .sidebar .kv { margin-top: 4mm; }
  .sidebar hr { border: 0; border-top: 1px solid ${c.accent}; margin: 7mm 0; opacity:.8; }
  .sidebar .iban { direction: ltr; text-align: right; font-size: 11.5px; font-weight: 700; }
  .main { margin-right: 68mm; padding-top: 4mm; }
  h1.display { font-size: 54px; font-weight: 900; letter-spacing: -1px; margin: 10mm 0 3mm; }
  .meta { display: flex; gap: 6mm; align-items: baseline; font-size: 12px; color: ${c.muted};
          border-bottom: 1px solid #d8cfc2; padding-bottom: 5mm; flex-wrap: wrap; }
  .meta .no { font-size: 20px; color: ${c.ink}; font-weight: 800; }
  .meta .no i { font-style: normal; font-size: 24px; }
  .thead { display: grid; grid-template-columns: 1fr 20mm; gap: 4mm;
          background: linear-gradient(270deg, ${c.accent}, #f2703f); color: #fff;
          border-radius: 2mm; padding: 3mm 5mm; font-size: 12px; font-weight: 700;
          margin-top: 6mm; }
  .thead .left { text-align: left; }
  .item { display: grid; grid-template-columns: 30mm 1fr 16mm; gap: 4mm; align-items: center;
          background: ${c.card}; border-radius: 2mm; padding: 5mm; margin-top: 3mm; }
  .item .num { font-size: 24px; font-weight: 300; text-align: center; }
  .item h4 { font-size: 14px; }
  .item p { font-size: 10.5px; color: ${c.muted}; margin-top: 1mm; }
  .item .amt { text-align: left; font-size: 15px; }
  .item .amt span { font-size: 9px; color: ${c.muted}; }
  .totals { margin-top: 9mm; display: grid; grid-template-columns: 1fr 62mm; gap: 8mm; }
  .trow { display: flex; justify-content: space-between; font-size: 12.5px; padding: 2mm 0; }
  .trow b { direction: ltr; }
  .trow.vat { border-top: 1px solid #d8cfc2; color: ${c.muted}; }
  .paybox { background: ${c.ink}; color: #fff; border-radius: 3mm; padding: 6mm 7mm; }
  .paybox .row { display: flex; justify-content: space-between; font-size: 12px; padding: 1.5mm 0; }
  .paybox .row b { direction: ltr; }
  .paybox .balance { border-top: 1px solid ${c.accent}; margin-top: 2mm; padding-top: 3mm;
          font-size: 14px; font-weight: 800; color: ${c.accent}; display: flex;
          justify-content: space-between; }
  .paybox .balance b { direction: ltr; }
  .renewal { margin-top: 6mm; background: ${c.accentSoft}; border-right: 3px solid ${c.accent};
          border-radius: 2mm; padding: 4mm 5mm; font-size: 11px; color: ${c.ink}; }
  .closing { text-align: center; margin-top: 10mm; font-size: 14px; font-weight: 700;
          color: ${c.accent}; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 5mm 12mm 6mm;
          border-top: 1px solid #d8cfc2; font-size: 9.5px; color: ${c.muted};
          text-align: center; background: ${c.paper}; }
  .footer .contact { color: ${c.accent}; margin-top: 1.5mm; }
</style>
</head>
<body>
  <section class="page">
    <div class="ring"></div>
    <aside class="sidebar">
      <div class="brand"><span class="ag">AG</span><b>${COMPANY.brandAr}</b></div>
      <h5>موجَّهة إلى</h5>
      <div class="kv"><b>${esc(payload.recipientName)}</b>
        ${payload.recipientCompany ? `<label>${esc(payload.recipientCompany)}</label>` : ''}</div>
      <div class="kv"><label>المشروع</label><b>${esc(payload.projectName)}</b></div>
      ${
        payload.relatedNumber
          ? `<div class="kv"><label>${payload.kind === 'credit_note' ? 'تصحيح للفاتورة' : 'مرجع العرض'}</label><b dir="ltr">${esc(payload.relatedNumber)}</b></div>`
          : ''
      }
      <hr>
      <h5>بيانات الحوالة البنكية</h5>
      <div class="kv"><label>المستفيد</label><b>${esc(payload.paymentAccount.beneficiaryName)}</b></div>
      <div class="kv"><label>البنك</label><b>${esc(payload.paymentAccount.bankName)}</b></div>
      <div class="kv"><label>الآيبان</label><div class="iban">${formatIBAN(payload.paymentAccount.iban)}</div></div>
    </aside>
    <div class="main">
      <h1 class="display">${title}</h1>
      <div class="meta">
        <span class="no">رقم · <i>${payload.number ? esc(payload.number.replace(/^(INV|CN)-/, '')) : 'مسودة'}</i></span>
        <span>تاريخ الإصدار: <b>${esc(payload.issueDateAr)}</b></span>
        ${payload.dueDateAr ? `<span>الاستحقاق: <b>${esc(payload.dueDateAr)}</b></span>` : ''}
        <span>${esc(payload.city)}</span>
      </div>
      <div class="thead"><span>الخدمات والمنتجات</span><span class="left">المبلغ</span></div>
      ${items}
      <div class="totals">
        <div>
          <div class="trow"><span>الإجمالي</span><b>${sign}SAR ${formatSAR(total)}</b></div>
          <div class="trow vat"><span>ضريبة القيمة المضافة</span><b>${payload.vatEnabled ? `SAR ${formatSAR(payload.vatAmount ?? 0)}` : '—'}</b></div>
        </div>
        <div class="paybox">
          <div class="row"><span>الإجمالي المستحق</span><b>${sign}SAR ${formatSAR(total + (payload.vatEnabled ? payload.vatAmount ?? 0 : 0))}</b></div>
          ${payload.kind === 'invoice' ? `<div class="row"><span>المدفوع</span><b>SAR ${formatSAR(paid)}</b></div>
          <div class="balance"><span>المتبقي</span><b>SAR ${formatSAR(balance)}</b></div>` : ''}
        </div>
      </div>
      ${payload.renewalNote ? `<div class="renewal">${esc(payload.renewalNote)}</div>` : ''}
      ${zatcaQr ? `<div style="display:flex;align-items:center;gap:5mm;margin-top:8mm">
        <div style="width:26mm;height:26mm">${zatcaQr}</div>
        <p style="font-size:9.5px;color:${c.muted}">فاتورة ضريبية مبسطة — رمز الاستجابة وفق متطلبات
        هيئة الزكاة والضريبة والجمارك (المرحلة الأولى)، الرقم الضريبي ${toArabicDigits(COMPANY.taxNumber)}.</p>
      </div>` : ''}
      <p class="closing">«${COMPANY.closingLine}»</p>
      <div class="footer">
        <div>${COMPANY.legalNameAr} · السجل التجاري ${toArabicDigits(COMPANY.cr)} · الرقم الضريبي ${toArabicDigits(COMPANY.taxNumber)} · الرمز البريدي ${toArabicDigits(COMPANY.postalCode)}</div>
        <div class="contact">${COMPANY.web} &nbsp;·&nbsp; ${COMPANY.phone} &nbsp;·&nbsp; ${COMPANY.emailDocuments}</div>
        <div>صفحة ${toArabicDigits('01')} / ${toArabicDigits('01')}</div>
      </div>
    </div>
  </section>
</body>
</html>`;
}

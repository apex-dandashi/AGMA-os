import { describe, expect, it } from 'vitest';
import {
  COMPANY,
  computeInvoiceTotal,
  renderInvoice,
  type InvoicePayload,
} from '../src/index';

const base: InvoicePayload = {
  number: 'INV-00053',
  kind: 'invoice',
  issueDateAr: '7 أغسطس 2026',
  city: 'الرياض',
  recipientName: 'السيد / رمضان',
  recipientCompany: 'مؤسسة شموع ألفا للتجارة',
  projectName: 'إعداد الهويّة والحضور الرقمي',
  relatedNumber: 'Q-00054',
  items: [
    { title: 'الهويّة البصرية الكاملة', amount: 1000 },
    { title: 'موقع المؤسسة الإلكتروني', amount: 3000 },
    { title: 'الاستضافة', description: 'Hostinger Premium · 4 سنوات', amount: 1500 },
  ],
  vatEnabled: false,
  paymentAccount: {
    iban: 'SA3880000296608016343793',
    bankName: 'مصرف الراجحي',
    beneficiaryName: COMPANY.legalNameAr,
  },
  paidAmount: 2750,
  renewalNote: 'التكلفة السنوية بعد السنة الأولى: 375 ر.س (الاستضافة).',
  dueDateAr: '21 أغسطس 2026',
};

describe('renderInvoice', () => {
  const html = renderInvoice(base);

  it('is deterministic', () => {
    expect(renderInvoice(base)).toBe(html);
  });

  it('totals and balance math', () => {
    expect(computeInvoiceTotal(base.items)).toBe(5500);
    expect(html).toContain('SAR 5,500'); // total due
    expect(html).toContain('SAR 2,750'); // paid + remaining (5500-2750)
  });

  it('renders فاتورة with number stripped of prefix', () => {
    expect(html).toContain('فاتورة');
    expect(html).toContain('00053');
  });

  it('reserves the VAT row with «—» in VAT-off mode (rule 4)', () => {
    expect(html).toContain('ضريبة القيمة المضافة');
    expect(html).toContain('>—<');
  });

  it('shows VAT amount when the flag is on', () => {
    const vat = renderInvoice({ ...base, vatEnabled: true, vatAmount: 825 });
    expect(vat).toContain('SAR 825');
  });

  it('always shows establishment beneficiary; never internal labels (rule 5)', () => {
    expect(html).toContain(COMPANY.legalNameAr);
    for (const label of ['internal_label', 'For A.Alghamdi', 'For A.Elibrahim']) {
      expect(html).not.toContain(label);
    }
  });

  it('renders the recurring-cost callout (docs/06 §3.6)', () => {
    expect(html).toContain('التكلفة السنوية بعد السنة الأولى');
  });

  it('references the source quote', () => {
    expect(html).toContain('Q-00054');
  });

  it('includes the closing line and entity footer', () => {
    expect(html).toContain(COMPANY.closingLine);
    expect(html).toContain('١٠٠٩١٢٧٥٢٨'); // CR in Arabic numerals
  });

  it('credit note renders إشعار دائن with negative-signed amounts, no balance box', () => {
    const cn = renderInvoice({
      ...base,
      kind: 'credit_note',
      number: 'CN-00001',
      relatedNumber: 'INV-00053',
      paidAmount: undefined,
    });
    expect(cn).toContain('إشعار دائن');
    expect(cn).toContain('تصحيح للفاتورة');
    expect(cn).toContain('−SAR');
    expect(cn).not.toContain('المتبقي');
  });

  it('escapes HTML in fields', () => {
    const evil = renderInvoice({ ...base, recipientName: '<img onerror=x>' });
    expect(evil).not.toContain('<img onerror');
  });
});

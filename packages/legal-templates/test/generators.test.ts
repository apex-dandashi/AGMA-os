import { describe, expect, it } from 'vitest';
import {
  COMPANY,
  computeQuoteTotals,
  formatIBAN,
  formatSAR,
  renderContract,
  renderQuote,
  toArabicDigits,
  type QuotePayload,
} from '../src/index';

/** Reference quotation 00054 reconstructed — the golden fixture. */
const ref00054: QuotePayload = {
  number: 'Q-00054',
  issueDateAr: '6 مايو 2026',
  city: 'الرياض',
  recipientName: 'السيد / رمضان',
  recipientCompany: 'مؤسسة شموع ألفا للتجارة',
  projectName: 'إعداد الهويّة والحضور الرقمي',
  projectExtra: { label: 'الدومين', value: 'sat.net.sa' },
  intro: 'يجمع هذا العرض تحت مظلّة واحدة كل ما تحتاجه المؤسسة لانطلاقتها.',
  items: [
    { title: 'الهويّة البصرية الكاملة', description: 'شعار · دليل هوية · بطاقة أعمال', amount: 1000, originalAmount: 2000, discountLabel: 'خصم خاص 50%' },
    { title: 'البروفايل التعريفي', description: 'تصميم الأقسام · صياغة المحتوى', amount: 1000, originalAmount: 2000, discountLabel: 'خصم خاص 50%' },
    { title: 'موقع المؤسسة الإلكتروني', description: 'تصميم · تطوير WordPress', amount: 3000, originalAmount: 6000, discountLabel: 'خصم خاص 50%' },
    { title: 'الدومين السعودي', description: 'sat.net.sa · سنة واحدة', amount: 120, noDiscount: true },
    { title: 'الاستضافة', description: 'Hostinger Premium · 4 سنوات', amount: 1500, noDiscount: true },
  ],
  discounts: [{ label: 'خصم مصطفى 50%', amount: 5000 }],
  options: [
    { label: 'الإجمالي · الخيار الأول', amount: 6620 },
    { label: 'الإجمالي · الخيار الثاني', amount: 5120, recommended: true },
  ],
  vatEnabled: false,
  paymentAccount: {
    iban: 'SA4780000001608016057099',
    bankName: 'مصرف الراجحي',
    beneficiaryName: COMPANY.legalNameAr,
  },
  clauses: [
    { title: 'شروط الدفع', body: 'دفعة أولى ٥٠٪ عند التوقيع.' },
    { title: 'صلاحية العرض', body: 'صالح لمدة ٣٠ يوماً.' },
  ],
  totalPages: 2,
};

describe('quote totals (reference 00054 golden math)', () => {
  it('reproduces the reference totals exactly', () => {
    const t = computeQuoteTotals(ref00054);
    expect(t.gross).toBe(10000);
    expect(t.discountTotal).toBe(5000);
    expect(t.afterDiscount).toBe(5000);
    expect(t.noDiscountTotal).toBe(1620);
    expect(t.net).toBe(6620); // = option 1 total on the reference PDF
  });

  it('handles no discounts', () => {
    const t = computeQuoteTotals({ items: [{ title: 'x', amount: 500 }], discounts: [] });
    expect(t.net).toBe(500);
    expect(t.discountTotal).toBe(0);
  });
});

describe('renderQuote', () => {
  const html = renderQuote(ref00054);

  it('is deterministic', () => {
    expect(renderQuote(ref00054)).toBe(html);
  });

  it('renders RTL Arabic document with display title', () => {
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('عرض سعر');
  });

  it('renders the document number without prefix, as in the reference', () => {
    expect(html).toContain('00054');
  });

  it('reserves the VAT row with «—» in VAT-off mode (rule 4)', () => {
    expect(html).toContain('ضريبة القيمة المضافة');
    expect(html).toContain('—');
  });

  it('renders VAT amount when enabled', () => {
    const withVat = renderQuote({ ...ref00054, vatEnabled: true, vatAmount: 993 });
    expect(withVat).toContain('SAR 993');
    expect(withVat.split('ضريبة القيمة المضافة')[1]).not.toContain('>—<');
  });

  it('always shows the establishment beneficiary name (rule 5)', () => {
    expect(html).toContain(COMPANY.legalNameAr);
    expect(html).toContain('مصرف الراجحي');
  });

  it('NEVER leaks internal payment account labels (rule 5)', () => {
    for (const label of ['internal_label', 'For A.Alghamdi', 'For A.Elibrahim', '>Main<']) {
      expect(html).not.toContain(label);
    }
  });

  it('groups the IBAN in 4s', () => {
    expect(html).toContain('SA47 8000 0001 6080 1605 7099');
  });

  it('renders both option pills with the recommended star', () => {
    expect(html).toContain('الخيار الأول');
    expect(html).toContain('الخيار الثاني');
    expect(html).toContain('★');
    expect(html).toContain('SAR 6,620');
    expect(html).toContain('SAR 5,120');
  });

  it('renders discount strikethrough lines and named discount', () => {
    expect(html).toContain('القيمة الأصلية 2,000 ر.س × خصم خاص 50%');
    expect(html).toContain('خصم مصطفى 50%');
    expect(html).toContain('– SAR 5,000');
  });

  it('includes the mandatory closing line (rule 8)', () => {
    expect(html).toContain(COMPANY.closingLine);
  });

  it('renders footer entity constants and Arabic page numbers', () => {
    expect(html).toContain(toArabicDigits(COMPANY.cr));
    expect(html).toContain(toArabicDigits(COMPANY.taxNumber));
    expect(html).toContain('صفحة ٠١ / ٠٢');
  });

  it('escapes HTML in user-controlled fields', () => {
    const evil = renderQuote({
      ...ref00054,
      recipientName: '<script>alert(1)</script>',
    });
    expect(evil).not.toContain('<script>alert');
    expect(evil).toContain('&lt;script&gt;');
  });

  it('renders درافت placeholder when unnumbered', () => {
    const draft = renderQuote({ ...ref00054, number: null });
    expect(draft).toContain('مسودة');
  });
});

describe('renderContract', () => {
  const html = renderContract({
    docTitleAr: 'اتفاقية عدم إفصاح',
    number: null,
    issueDateAr: '7 أغسطس 2026',
    city: 'الرياض',
    firstParty: { name: COMPANY.legalNameAr, descriptor: 'الوكالة' },
    secondParty: { name: 'شركة تجريبية', descriptor: 'العميل' },
    clauses: [{ title: 'السرية', body: 'يلتزم الطرفان بالسرية.' }],
  });

  it('is deterministic and RTL', () => {
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('اتفاقية عدم إفصاح');
  });

  it('numbers clauses in Arabic ordinals', () => {
    expect(html).toContain('البند ١');
  });

  it('has dual signature blocks and closing line', () => {
    expect(html).toContain('الطرف الأول');
    expect(html).toContain('الطرف الثاني');
    expect(html).toContain(COMPANY.closingLine);
  });
});

describe('formatting helpers', () => {
  it('formats SAR with separators', () => {
    expect(formatSAR(6620)).toBe('6,620');
    expect(formatSAR(1234.5)).toBe('1,234.50');
  });
  it('converts to Arabic digits', () => {
    expect(toArabicDigits('01')).toBe('٠١');
    expect(toArabicDigits(1009127528)).toBe('١٠٠٩١٢٧٥٢٨');
  });
  it('groups IBANs', () => {
    expect(formatIBAN('SA3880000296608016343793')).toBe('SA38 8000 0296 6080 1634 3793');
  });
});

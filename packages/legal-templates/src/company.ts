/**
 * Entity constants — single source of truth (docs/06 §1, §1b).
 * Rendered on every legal document footer; never hardcode these elsewhere.
 */
export const COMPANY = {
  legalNameAr: 'مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية',
  brandAr: 'جيل الذكاء الاصطناعي',
  brandEn: 'AGMA',
  cr: '1009127528',
  taxNumber: '313630147',
  unifiedNumber: '7042355441',
  postalCode: '12837',
  city: 'الرياض',
  web: 'www.agma.com.sa',
  phone: '+966 58 119 5387',
  emailDocuments: 'care@agma.com.sa',
  emailGeneral: 'hello@agma.com.sa',
  bankAr: 'مصرف الراجحي',
  /** docs/06 §2 — mandatory closing on client documents. */
  closingLine: 'بإذن الله إلى تعاونٍ مثمر',
} as const;

/** Document palette (from reference PDFs — quotation 00054 ground truth). */
export const DOC_COLORS = {
  paper: '#F1EBE1',
  card: '#FFFFFF',
  ink: '#2B211B',
  accent: '#E8542F',
  accentSoft: '#F6E3DC',
  muted: '#8A7F76',
} as const;

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

/** Western → Arabic-Indic numerals (page numbers per docs/06 §2). */
export function toArabicDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

/** SAR amount with thousands separators, western numerals as in references. */
export function formatSAR(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** IBAN display-grouped in 4s, LTR, as in the reference sidebar. */
export function formatIBAN(iban: string): string {
  return iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
}

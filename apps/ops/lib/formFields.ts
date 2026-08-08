/** أنواع حقول Drop Forms — مشتركة بين المنشئ (الفريق) والمعبّي (البوابة). */

export type FormFieldType =
  | 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multi'
  | 'yesno' | 'phone' | 'file' | 'url' | 'email';

export type FormFieldDef = {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
};

export const FIELD_TYPE_AR: Record<FormFieldType, string> = {
  text: 'نص قصير',
  textarea: 'نص طويل',
  number: 'رقم',
  date: 'تاريخ',
  select: 'اختيار واحد',
  multi: 'اختيارات متعددة',
  yesno: 'نعم / لا',
  phone: 'رقم جوال',
  file: 'ملف مرفق',
  url: 'رابط',
  email: 'بريد إلكتروني',
};

export function parseFields(raw: unknown): FormFieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((f): f is FormFieldDef =>
    !!f && typeof f === 'object' && typeof (f as FormFieldDef).key === 'string'
    && typeof (f as FormFieldDef).label === 'string');
}

export function newFieldKey(existing: FormFieldDef[]): string {
  let i = existing.length + 1;
  while (existing.some((f) => f.key === `f${i}`)) i++;
  return `f${i}`;
}

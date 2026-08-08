import { z } from 'zod';

/**
 * Shared validation schemas — the single source used by ops forms, edge
 * functions, and payload guards (CLAUDE.md: Zod at every boundary).
 * Error messages are Arabic: they surface directly in the ops UI.
 *
 * Normalization mirrors the DB triggers (normalize_digits /
 * normalize_phone_sa in 20260807170000): the same value is produced whether
 * data enters via a form, the edge function, or SQL.
 */

const DIGIT_MAP: Record<string, string> = {};
for (const [i, ch] of [...'٠١٢٣٤٥٦٧٨٩'].entries()) DIGIT_MAP[ch] = String(i);
for (const [i, ch] of [...'۰۱۲۳۴۵۶۷۸۹'].entries()) DIGIT_MAP[ch] = String(i);

/** Arabic-Indic and Persian digits → Latin. */
export function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (ch) => DIGIT_MAP[ch] ?? ch);
}

/** Saudi phone → E.164 (+9665XXXXXXXX); foreign numbers pass through. */
export function normalizePhoneSa(s: string): string {
  let d = normalizeDigits(s).replace(/[^0-9+]/g, '').replace(/^00/, '+');
  if (d.startsWith('+966')) d = '+966' + d.slice(4).replace(/^0+/, '');
  else if (d.startsWith('966')) d = '+966' + d.slice(3).replace(/^0+/, '');
  else if (/^05[0-9]{8}$/.test(d)) d = '+966' + d.slice(1);
  else if (/^5[0-9]{8}$/.test(d)) d = '+966' + d;
  return d;
}

const optionalPhone = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : normalizePhoneSa(v)))
  .pipe(z.string().regex(/^\+?[0-9]{7,15}$/, 'رقم هاتف غير صالح').optional());

const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v.toLowerCase()))
  .pipe(z.string().email('بريد غير صالح').max(200).optional());

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب (حرفان على الأقل)').max(200),
  company: z.string().trim().max(200).optional().or(z.literal('').transform(() => undefined)),
  source: z.enum(['call', 'whatsapp', 'email', 'site']),
  notes: z.string().trim().max(4000).optional().or(z.literal('').transform(() => undefined)),
});

export const leadIntakeSchema = z.object({
  name: z.string().trim().min(2).max(200),
  company: z.string().trim().max(200).optional(),
  phone: optionalPhone.catch(undefined),
  email: optionalEmail.catch(undefined),
  services: z.string().trim().max(500).optional(),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
  /** Honeypot — must be empty for humans. */
  website: z.string().max(0, 'bot').optional().or(z.literal('')),
});

export const clientInputSchema = z.object({
  company: z.string().trim().min(2, 'اسم الشركة مطلوب').max(200),
  sector: z.string().trim().max(120).optional().or(z.literal('').transform(() => undefined)),
  decision_maker: z.string().trim().max(200).optional().or(z.literal('').transform(() => undefined)),
  budget_tier: z.string().trim().max(60).optional().or(z.literal('').transform(() => undefined)),
});

export const contactInputSchema = z.object({
  name: z.string().trim().min(2, 'اسم جهة الاتصال مطلوب').max(200),
  title: z.string().trim().max(120).optional().or(z.literal('').transform(() => undefined)),
  phone: optionalPhone,
  email: optionalEmail,
});

export const interactionInputSchema = z.object({
  kind: z.enum(['call', 'whatsapp', 'email', 'meeting', 'note']),
  summary: z.string().trim().min(3, 'الملخص مطلوب').max(2000),
});

export const scopeInputSchema = z.object({
  service_ids: z.array(z.string().uuid()),
  // L12: أي شاشة خدمات تتيح إضافة حرة — خدمات خارج الكتالوج تُكتب نصاً
  extra_services: z.array(z.string().trim().min(2, 'اسم الخدمة قصير').max(120)).max(20).default([]),
  timeline: z.string().trim().max(200).optional().or(z.literal('').transform(() => undefined)),
  responsibilities: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
}).refine((v) => v.service_ids.length + v.extra_services.length > 0,
  { message: 'اختر خدمة واحدة على الأقل', path: ['service_ids'] });

export const quoteItemSchema = z.object({
  title: z.string().trim().min(2, 'اسم الخدمة مطلوب').max(200),
  description: z.string().trim().max(500).optional(),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر').max(10_000_000),
  originalAmount: z.number().positive().max(10_000_000).optional(),
  discountLabel: z.string().trim().max(100).optional(),
  noDiscount: z.boolean().optional(),
});

export const quoteDraftSchema = z.object({
  clientId: z.string().uuid('اختر العميل'),
  recipientName: z.string().trim().max(200),
  projectName: z.string().trim().min(2, 'اسم المشروع مطلوب').max(200),
  intro: z.string().trim().max(1000).optional().or(z.literal('').transform(() => undefined)),
  items: z.array(quoteItemSchema).min(1, 'أضف بنداً واحداً على الأقل'),
  discountLabel: z.string().trim().max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  accountId: z.string().uuid('اختر حساب التحويل'),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type ClientInput = z.infer<typeof clientInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type InteractionInput = z.infer<typeof interactionInputSchema>;
export type ScopeInput = z.infer<typeof scopeInputSchema>;
export type QuoteDraftInput = z.infer<typeof quoteDraftSchema>;

/** First error message of a failed parse — for toast/inline display. */
export function firstError(result: { success: false; error: z.ZodError }): string {
  return result.error.issues[0]?.message ?? 'بيانات غير صالحة';
}

import { z } from 'zod';

/**
 * Shared validation schemas — the single source used by ops forms, edge
 * functions, and payload guards (CLAUDE.md: Zod at every boundary).
 * Error messages are Arabic: they surface directly in the ops UI.
 */

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب (حرفان على الأقل)').max(200),
  company: z.string().trim().max(200).optional().or(z.literal('').transform(() => undefined)),
  source: z.enum(['call', 'whatsapp', 'email', 'site']),
  notes: z.string().trim().max(4000).optional().or(z.literal('').transform(() => undefined)),
});

export const leadIntakeSchema = z.object({
  name: z.string().trim().min(2).max(200),
  company: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal('').transform(() => undefined)),
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
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, 'رقم هاتف غير صالح')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  email: z.string().trim().email('بريد غير صالح').max(200).optional().or(z.literal('').transform(() => undefined)),
});

export const interactionInputSchema = z.object({
  kind: z.enum(['call', 'whatsapp', 'email', 'meeting', 'note']),
  summary: z.string().trim().min(3, 'الملخص مطلوب').max(2000),
});

export const scopeInputSchema = z.object({
  service_ids: z.array(z.string().uuid()).min(1, 'اختر خدمة واحدة على الأقل'),
  timeline: z.string().trim().max(200).optional().or(z.literal('').transform(() => undefined)),
  responsibilities: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
});

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

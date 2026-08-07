import type { Tables } from '@agma/db';

/**
 * In-app notification text — mirrors the DB inapp templates
 * (packages can't read notification_templates at render time cheaply;
 * keys are stable, payloads carry the variables).
 */
const TEXTS: Record<string, (p: Record<string, string>) => string> = {
  invoice_issued: (p) => `صدرت الفاتورة ${p.number} لـ ${p.client} بقيمة SAR ${p.total}`,
  invoice_overdue: (p) => `الفاتورة ${p.number} (${p.client}) متأخرة — المتبقي SAR ${p.balance}`,
  approval_pending_48h: (p) => `اعتماد ${p.item} لـ ${p.client} معلّق منذ 48 ساعة`,
  task_overdue: (p) => `لديك ${p.count} مهمة متأخرة — أقدمها: ${p.title}`,
  wallet_80: (p) => `محفظة ${p.client} الإعلانية بلغت ${p.pct}% من الميزانية`,
  retainer_generated: (p) => `وُلدت فاتورة اشتراك «${p.title}» لـ ${p.client} — راجعها واعتمدها`,
  quote_expired: (p) => `انتهت صلاحية عرض السعر ${p.number} (${p.client})`,
};

export function renderNotificationText(n: Tables<'notifications'>): string {
  const payload = (n.payload ?? {}) as Record<string, string>;
  const fn = TEXTS[n.template_key];
  return fn ? fn(payload) : n.event_key;
}

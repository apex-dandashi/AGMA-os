import type { QuotePayload, QuoteTotals } from './types';

/**
 * Totals math mirroring reference 00054: percentage-style discounts apply to
 * discountable items only; noDiscount items (domain/hosting) are added on top.
 */
export function computeQuoteTotals(
  payload: Pick<QuotePayload, 'items' | 'discounts'>
): QuoteTotals {
  const discountable = payload.items.filter((i) => !i.noDiscount);
  const excluded = payload.items.filter((i) => i.noDiscount);

  const gross = discountable.reduce(
    (sum, i) => sum + (i.originalAmount ?? i.amount),
    0
  );
  const discountTotal = payload.discounts.reduce((sum, d) => sum + d.amount, 0);
  const afterDiscount = gross - discountTotal;
  const noDiscountTotal = excluded.reduce((sum, i) => sum + i.amount, 0);

  return {
    gross,
    discountTotal,
    afterDiscount,
    noDiscountTotal,
    net: afterDiscount + noDiscountTotal,
  };
}

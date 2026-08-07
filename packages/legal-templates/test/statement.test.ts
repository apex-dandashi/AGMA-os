import { describe, expect, it } from 'vitest';
import { renderStatement } from '../src';

const PAYLOAD = {
  clientName: 'شركة الاختبار',
  issueDateAr: '7 أغسطس 2026',
  rows: [
    { number: 'INV-00053', issuedOn: '2026-07-01', kind: 'invoice' as const, total: 5500, paid: 2750 },
    { number: 'INV-00054', issuedOn: '2026-07-20', kind: 'invoice' as const, total: 3000, paid: 3000 },
    { number: 'CN-00001', issuedOn: '2026-07-25', kind: 'credit_note' as const, total: 500, paid: 0 },
  ],
};

describe('renderStatement', () => {
  it('computes invoiced/paid/balance with credit notes subtracted', () => {
    const html = renderStatement(PAYLOAD);
    // invoiced = 5500 + 3000 - 500 = 8000 ; paid = 5750 ; balance = 2250
    expect(html).toContain('8,000');
    expect(html).toContain('5,750');
    expect(html).toContain('2,250');
    expect(html).toContain('كشف حساب');
    expect(html).toContain('INV-00053');
    expect(html).toContain('إشعار دائن');
  });

  it('is deterministic', () => {
    expect(renderStatement(PAYLOAD)).toBe(renderStatement(PAYLOAD));
  });
});

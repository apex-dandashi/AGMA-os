import { describe, expect, it } from 'vitest';
import { renderInvoice, zatcaQrSvg, zatcaTlvBase64 } from '../src';
import type { InvoicePayload } from '../src';

const INPUT = {
  sellerName: 'مؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية',
  vatNumber: '313630147',
  timestamp: '2026-08-07T09:30:00Z',
  total: 5750,
  vat: 750,
};

function decodeB64(b64: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    buffer = (buffer << 6) | chars.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

describe('zatca phase-1 TLV', () => {
  it('encodes the five tags in order with correct lengths', () => {
    const bytes = decodeB64(zatcaTlvBase64(INPUT));
    const dec = new TextDecoder();
    let i = 0;
    const fields: Record<number, string> = {};
    while (i < bytes.length) {
      const tag = bytes[i];
      const len = bytes[i + 1];
      fields[tag] = dec.decode(Uint8Array.from(bytes.slice(i + 2, i + 2 + len)));
      i += 2 + len;
    }
    expect(Object.keys(fields)).toEqual(['1', '2', '3', '4', '5']);
    expect(fields[1]).toBe(INPUT.sellerName);
    expect(fields[2]).toBe('313630147');
    expect(fields[3]).toBe('2026-08-07T09:30:00Z');
    expect(fields[4]).toBe('5750.00');
    expect(fields[5]).toBe('750.00');
  });

  it('is deterministic and renders an SVG QR', () => {
    expect(zatcaTlvBase64(INPUT)).toBe(zatcaTlvBase64({ ...INPUT }));
    const svg = zatcaQrSvg(INPUT);
    expect(svg).toContain('<svg');
    expect(zatcaQrSvg(INPUT)).toBe(svg);
  });
});

const BASE: InvoicePayload = {
  number: 'INV-00060',
  kind: 'invoice',
  issueDateAr: '7 أغسطس 2026',
  city: 'الرياض',
  recipientName: 'شركة الاختبار',
  projectName: 'مشروع تجريبي',
  items: [{ title: 'خدمة', description: '', amount: 5000 }],
  vatEnabled: true,
  vatAmount: 750,
  paymentAccount: { iban: 'SA0000000000000000000000', bankName: 'مصرف الراجحي', beneficiaryName: 'AGMA' },
};

describe('renderInvoice + zatca', () => {
  it('renders the QR block only when numbered with a timestamp', () => {
    const withQr = renderInvoice({ ...BASE, issuedAtIso: '2026-08-07T09:30:00Z' });
    expect(withQr).toContain('<svg');
    expect(withQr).toContain('فاتورة ضريبية مبسطة');

    const draft = renderInvoice({ ...BASE, number: null, issuedAtIso: '2026-08-07T09:30:00Z' });
    expect(draft).not.toContain('فاتورة ضريبية مبسطة');

    const legacy = renderInvoice(BASE);
    expect(legacy).not.toContain('فاتورة ضريبية مبسطة');
  });

  it('never renders a QR on credit notes', () => {
    const cn = renderInvoice({
      ...BASE, kind: 'credit_note', issuedAtIso: '2026-08-07T09:30:00Z', number: 'CN-00002',
    });
    expect(cn).not.toContain('فاتورة ضريبية مبسطة');
  });
});

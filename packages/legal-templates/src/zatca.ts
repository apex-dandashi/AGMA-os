import qrcode from 'qrcode-generator';

/**
 * ZATCA Phase-1 (simplified tax invoice) QR: TLV-encoded, base64'd, rendered
 * as QR. Tags: 1 seller name · 2 VAT number · 3 timestamp (ISO 8601) ·
 * 4 total with VAT · 5 VAT amount. Mandatory on Saudi tax invoices since
 * 2021-12-04. Deterministic — same inputs, same SVG.
 */
export interface ZatcaInput {
  sellerName: string;
  vatNumber: string;
  /** ISO 8601, e.g. 2026-08-07T09:30:00Z */
  timestamp: string;
  /** Invoice total inclusive of VAT. */
  total: number;
  /** VAT amount. */
  vat: number;
}

export function zatcaTlvBase64(input: ZatcaInput): string {
  const enc = new TextEncoder();
  const fields: [number, string][] = [
    [1, input.sellerName],
    [2, input.vatNumber],
    [3, input.timestamp],
    [4, input.total.toFixed(2)],
    [5, input.vat.toFixed(2)],
  ];
  const parts: number[] = [];
  for (const [tag, value] of fields) {
    const bytes = enc.encode(value);
    if (bytes.length > 255) throw new Error(`zatca tlv field ${tag} too long`);
    parts.push(tag, bytes.length, ...bytes);
  }
  // btoa is unavailable in Node — build base64 from bytes portably.
  const bin = Uint8Array.from(parts);
  let b64 = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < bin.length; i += 3) {
    const b0 = bin[i], b1 = bin[i + 1], b2 = bin[i + 2];
    b64 += chars[b0 >> 2];
    b64 += chars[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    b64 += b1 === undefined ? '=' : chars[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    b64 += b2 === undefined ? '=' : chars[b2 & 63];
  }
  return b64;
}

/** QR of the TLV payload as an inline SVG string (no external requests). */
export function zatcaQrSvg(input: ZatcaInput): string {
  const qr = qrcode(0, 'M');
  qr.addData(zatcaTlvBase64(input), 'Byte');
  qr.make();
  return qr.createSvgTag({ cellSize: 2, margin: 0, scalable: true });
}

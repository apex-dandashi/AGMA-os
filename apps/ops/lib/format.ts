/**
 * Shared output formatting — one voice for numbers and dates everywhere
 * (previously each panel had its own local `fmt`).
 */

/** 12,345 — Latin digits, Western grouping (matches the legal documents). */
export const fmtNum = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('en-US');

/** SAR 12,345 as a ready string for dir="ltr" spans. */
export const fmtSAR = (n: number | string | null | undefined) =>
  `SAR ${fmtNum(n)}`;

/** ISO timestamp/date → YYYY-MM-DD. */
export const fmtDate = (iso: string | null | undefined) =>
  iso ? iso.slice(0, 10) : '—';

/**
 * AGMA design tokens — single source of truth for all apps and generated documents.
 *
 * Sources:
 *  - apps/marketing globals.css `@theme` block (the live agma.com.sa look)
 *  - docs/06-brand-standards.md §2 (document palette + typography contract)
 *
 * RTL-first: all apps render `<html lang="ar" dir="rtl">` by default; components
 * must use logical properties (ms-, me-, ps-, pe-, start/end) — never left/right.
 */

/** Web palette (from the live site). */
export const colors = {
  /** Primary accent — headers, CTAs, totals highlight. */
  pulseOrange: '#F44D2B',
  /** Page background / dark blocks. */
  pureInk: '#0A0A0A',
  /** Primary text on dark. */
  snow: '#FAFAFA',
  grayDark: '#262626',
  grayMedium: '#737373',
  grayLight: '#D4D4D4',
} as const;

/**
 * Document palette (quotes/invoices — docs/06 §2).
 * TODO(phase-3): sample exact cream/brown values from docs/references PDFs
 * before the legal generators ship; these are provisional approximations.
 */
export const documentColors = {
  /** Cream/beige paper background. */
  paper: '#F5F0E8',
  /** Near-black brown — sidebar panels, dark pills. */
  inkBrown: '#1C1512',
  /** White content cards. */
  card: '#FFFFFF',
  /** Accent — same pulse orange as web. */
  accent: colors.pulseOrange,
} as const;

/** Typography — Arabic-first; Latin only for technical terms (docs/06 §2). */
export const typography = {
  /** Headings / display (huge Arabic display titles on documents). */
  heading: {
    family: 'Tajawal',
    fallback: 'sans-serif',
    weights: [400, 500, 700, 800, 900],
    cssVariable: '--font-tajawal',
  },
  /** Body / UI text. */
  body: {
    family: 'IBM Plex Sans Arabic',
    fallback:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    weights: [300, 400, 500, 600, 700],
    cssVariable: '--font-ibm-plex',
  },
  /** Tight tracking used on site headings. */
  headingLetterSpacing: '-0.05em',
} as const;

/** Spacing scale (4px base — matches Tailwind defaults used by the site). */
export const spacing = {
  unit: 4,
  scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const,
} as const;

/** Radii used on the site (buttons are rounded-sm; outline CTA is a pill). */
export const radii = {
  sm: '0.125rem',
  md: '0.375rem',
  pill: '9999px',
} as const;

export const tokens = {
  colors,
  documentColors,
  typography,
  spacing,
  radii,
} as const;

export type Tokens = typeof tokens;

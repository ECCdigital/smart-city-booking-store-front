/**
 * The metric overrides that make a local system font take the room of the
 * instance's font (ECCdigital/tickets#531). With `font-display: optional` a
 * font that misses the first paint is never swapped in; what stands in its
 * place for the rest of the document is this fallback, so it has to be as wide
 * and as tall as the font itself, or the page would set differently from what
 * the next visit shows.
 *
 * The formula is the one `fontaine` and `@nuxt/fonts` use: `size-adjust`
 * scales the system font to the font's average advance width (`xWidthAvg`, the
 * capsize weighting by English letter frequency), and the vertical metrics are
 * divided by that scale so the line box comes out at the font's own height.
 *
 * Deliberately free of imports: `scripts/curated-fonts.mjs` loads this file
 * straight into Node to compute the table of the curated list, and the theme
 * stylesheet computes the same values for an uploaded font at run time.
 */

/** What capsize reads from a font file, in font units. */
export interface FontMetrics {
  ascent: number;
  /** Negative below the baseline, as capsize reports it. */
  descent: number;
  lineGap: number;
  unitsPerEm: number;
  xWidthAvg: number;
}

/** One `@font-face` of a fallback, the overrides in percent. */
export interface FallbackFace {
  family: string;
  /** The name of the local font in `src: local(…)`. */
  local: string;
  sizeAdjust: number;
  ascentOverride: number;
  descentOverride: number;
  lineGapOverride: number;
}

/**
 * The system fonts the fallbacks stand on, in capsize's numbers
 * (`@capsizecss/metrics` 3.6.2, which weighs the average width the same way
 * as `@capsizecss/unpack` 4). Four numbers each, rather than the 130 MB
 * metrics package at run time.
 */
export const SYSTEM_FONTS = {
  arial: {
    local: "Arial",
    metrics: { ascent: 1854, descent: -434, lineGap: 67, unitsPerEm: 2048, xWidthAvg: 913 },
  },
  roboto: {
    local: "Roboto",
    metrics: { ascent: 1900, descent: -500, lineGap: 0, unitsPerEm: 2048, xWidthAvg: 911 },
  },
  timesNewRoman: {
    local: "Times New Roman",
    metrics: { ascent: 1825, descent: -443, lineGap: 87, unitsPerEm: 2048, xWidthAvg: 832 },
  },
} as const satisfies Record<string, { local: string; metrics: FontMetrics }>;

/**
 * The two fallback families every font gets, tried in order. Arial (or Times
 * New Roman for a serif) is there on Windows, macOS and iOS, but not on
 * Android, which has Roboto instead. A face whose local font is missing fails
 * to load, and the browser moves on to the next family in `--font-sans`.
 */
export const FALLBACK_FAMILIES = {
  desktop: "Theme Font Fallback A",
  android: "Theme Font Fallback R",
} as const;

const percent = (value: number): number => Math.round(value * 10000) / 100;

function fallbackFace(
  font: FontMetrics,
  family: string,
  system: { local: string; metrics: FontMetrics },
): FallbackFace {
  const scale =
    font.xWidthAvg / font.unitsPerEm /
    (system.metrics.xWidthAvg / system.metrics.unitsPerEm);
  const em = font.unitsPerEm * scale;

  return {
    family,
    local: system.local,
    sizeAdjust: percent(scale),
    ascentOverride: percent(font.ascent / em),
    descentOverride: percent(Math.abs(font.descent) / em),
    lineGapOverride: percent(font.lineGap / em),
  };
}

/**
 * The fallback faces of one font.
 *
 * @param font - The metrics of the font at weight 400.
 * @param serif - Whether the font has serifs; it then stands on Times New
 *   Roman on the desktop rather than on Arial.
 * @returns The faces, desktop first, or `[]` when the metrics are unusable.
 */
export function fallbackFaces(font: FontMetrics, serif = false): FallbackFace[] {
  const usable =
    [font.ascent, font.descent, font.lineGap].every(Number.isFinite) &&
    font.unitsPerEm > 0 &&
    font.xWidthAvg > 0;
  if (!usable) return [];

  return [
    fallbackFace(
      font,
      FALLBACK_FAMILIES.desktop,
      serif ? SYSTEM_FONTS.timesNewRoman : SYSTEM_FONTS.arial,
    ),
    fallbackFace(font, FALLBACK_FAMILIES.android, SYSTEM_FONTS.roboto),
  ];
}

/**
 * Renders the instance's colours as the stylesheet the storefront links in its
 * document head.
 *
 * The stylesheet routes used to sit behind the shared conditional cache with a
 * 300 s TTL of their own. They read the Theme Bundle directly now, so the
 * freshness of the stylesheet is the freshness of the bundle (storefront ADR
 * 0001) and the only thing worth caching is the render itself — which is what
 * this module memoises, keyed by the bundle's etag.
 */

import { createEtagMemo } from "./etagMemo";

export interface ThemeCssColors {
  primary?: string;
  secondary?: string;
}

export interface RenderThemeCssInput {
  /** The Theme Bundle's etag — the identity of the rendered content. */
  etag: string;
  colors: ThemeCssColors | null | undefined;
  /** What to declare when the bundle names no usable colour pair. */
  defaults: Required<ThemeCssColors>;
}

/** Rendered stylesheets, keyed by etag and by the route's own defaults. */
const rendered = createEtagMemo<string>(64);

/**
 * The colours travel from the backend straight into a stylesheet, so a value
 * that could end the declaration must never reach the output — otherwise
 * whoever can write the instance's branding can write CSS rules of their own.
 *
 * The test is deliberately about syntax rather than about colour: `#fff`,
 * `rebeccapurple` and `rgb(1, 2, 3)` are all legitimate stored values and all
 * pass, while a `;`, a brace, a comment or a quote — the characters needed to
 * break out of `--ui-primary: …` — do not.
 */
const SAFE_COLOR = /^[a-zA-Z0-9#(),.%\s-]{1,64}$/;

function isSafeColorPair(colors: ThemeCssColors | null | undefined): boolean {
  if (!colors?.primary || !colors?.secondary) return false;
  return SAFE_COLOR.test(colors.primary) && SAFE_COLOR.test(colors.secondary);
}

function render(colors: Required<ThemeCssColors>): string {
  const declarations = `  --ui-primary: ${colors.primary};\n  --ui-secondary: ${colors.secondary};`;
  return `:root {\n${declarations}\n}\n.dark {\n${declarations}\n}\n`;
}

/**
 * The stylesheet for one Theme Bundle.
 *
 * @param input - The bundle's etag and colours, plus the route's own defaults.
 * @returns The CSS text, rendered once per etag and set of defaults.
 */
export function renderThemeCss(input: RenderThemeCssInput): string {
  const { etag, colors, defaults } = input;
  const key = `${etag}::${defaults.primary}::${defaults.secondary}`;

  const memoised = rendered.get(key);
  if (memoised !== undefined) return memoised;

  return rendered.set(
    key,
    render(isSafeColorPair(colors) ? (colors as Required<ThemeCssColors>) : defaults),
  );
}

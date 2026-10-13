/**
 * Renders the instance's colours as the stylesheet the storefront links in its
 * document head: primary and secondary, the text colour on each, and the
 * colours of the header bar. The contrast is computed here, on the server, so
 * text on a colour is right in the first paint, without JavaScript.
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

/** The colours the header bar can take (`branding.header`). */
export type ThemeCssHeader = "neutral" | "primary" | "secondary";

export interface RenderThemeCssInput {
  /** The Theme Bundle's etag — the identity of the rendered content. */
  etag: string;
  colors: ThemeCssColors | null | undefined;
  /**
   * The bundle's `header`. Anything but one of the three values — missing,
   * or unknown — reads as `"primary"`, the look from before the setting.
   */
  header?: unknown;
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

const BLACK = "#000000";
const WHITE = "#ffffff";

/**
 * The text colour on a colour: black above a luma of 180, white otherwise —
 * the rule `useContrastColor` applied on the client, so no instance changes
 * its look. Only `#rgb` and `#rrggbb` are computed; any other value (a colour
 * name, `rgb()`, `hsl()`) gives white, as it did before.
 */
function contrastOf(color: string): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return WHITE;

  const digits = match[1]!;
  const hex =
    digits.length === 3
      ? [...digits].map((digit) => digit + digit).join("")
      : digits;
  const rgb = Number.parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 180 ? BLACK : WHITE;
}

function headerOf(value: unknown): ThemeCssHeader {
  return value === "neutral" || value === "secondary" ? value : "primary";
}

/**
 * The neutral header is fixed per colour mode and computes nothing: white with
 * the app's near-black text (gray-900) in light, and in dark the footer's
 * ground (`bg-gray-900`) with white text. Opaque on purpose, see the iOS note
 * in `NavigationBar.vue`.
 */
const NEUTRAL_HEADER = {
  light: { bar: WHITE, contrast: "#101828" },
  dark: { bar: "#101828", contrast: WHITE },
} as const;

function render(colors: Required<ThemeCssColors>, header: ThemeCssHeader): string {
  // The active tab stands out from the bar: in secondary with a primary
  // stripe, unless the bar itself is secondary — then the other way round.
  const [active, stripe] =
    header === "secondary"
      ? [colors.primary, colors.secondary]
      : [colors.secondary, colors.primary];

  const colorDeclarations = [
    `  --ui-primary: ${colors.primary};`,
    `  --ui-secondary: ${colors.secondary};`,
    `  --ui-primary-contrast: ${contrastOf(colors.primary)};`,
    `  --ui-secondary-contrast: ${contrastOf(colors.secondary)};`,
  ];
  const activeTab = [
    `  --ui-header-active: ${active};`,
    `  --ui-header-active-contrast: ${contrastOf(active)};`,
    `  --ui-header-active-stripe: ${stripe};`,
  ];

  const headerIn = (mode: keyof typeof NEUTRAL_HEADER): string[] => {
    if (header === "neutral") {
      const { bar, contrast } = NEUTRAL_HEADER[mode];
      return [`  --ui-header: ${bar};`, `  --ui-header-contrast: ${contrast};`];
    }
    const bar = header === "secondary" ? colors.secondary : colors.primary;
    return [`  --ui-header: ${bar};`, `  --ui-header-contrast: ${contrastOf(bar)};`];
  };

  const block = (mode: keyof typeof NEUTRAL_HEADER): string =>
    [...colorDeclarations, ...headerIn(mode), ...activeTab].join("\n");
  return `:root {\n${block("light")}\n}\n.dark {\n${block("dark")}\n}\n`;
}

/**
 * The stylesheet for one Theme Bundle.
 *
 * @param input - The bundle's etag and colours, plus the route's own defaults.
 * @returns The CSS text, rendered once per etag and set of defaults.
 */
export function renderThemeCss(input: RenderThemeCssInput): string {
  const { etag, colors, header, defaults } = input;
  const key = `${etag}::${defaults.primary}::${defaults.secondary}`;

  const memoised = rendered.get(key);
  if (memoised !== undefined) return memoised;

  return rendered.set(
    key,
    render(
      isSafeColorPair(colors) ? (colors as Required<ThemeCssColors>) : defaults,
      headerOf(header),
    ),
  );
}

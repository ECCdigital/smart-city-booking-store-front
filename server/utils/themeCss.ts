/**
 * Renders the instance's colours as the stylesheet the storefront links in its
 * document head: primary and secondary, the accent if the instance set one,
 * the text colour on each, and the colours of the header bar. The contrast is computed here, on the server, so
 * text on a colour is right in the first paint, without JavaScript. With an
 * instance font it also declares the font, its fallbacks and `--font-sans`.
 *
 * The stylesheet routes used to sit behind the shared conditional cache with a
 * 300 s TTL of their own. They read the Theme Bundle directly now, so the
 * freshness of the stylesheet is the freshness of the bundle (storefront ADR
 * 0001) and the only thing worth caching is the render itself — which is what
 * this module memoises, keyed by the bundle's etag.
 */

import { createEtagMemo } from "./etagMemo";
import type { ThemeFont } from "./themeFont";

export interface ThemeCssColors {
  primary?: string;
  secondary?: string;
  /** Optional: `""` or missing means the instance set no accent. */
  accent?: string;
}

/** The colour pair every stylesheet declares, the instance's or the route's. */
type ColorPair = Required<Pick<ThemeCssColors, "primary" | "secondary">>;

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
  defaults: ColorPair;
  /** The instance font, as `readThemeFont` reads it; none for the system font. */
  font?: ThemeFont | null;
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

/**
 * The accent, if the instance set one that may reach the CSS. It stands on its
 * own: an unusable accent is simply absent and leaves the pair alone, and a
 * usable one is declared even when the pair falls back to the defaults.
 */
function accentOf(colors: ThemeCssColors | null | undefined): string | null {
  const accent = colors?.accent;
  if (typeof accent !== "string" || accent.trim() === "") return null;
  return SAFE_COLOR.test(accent) ? accent : null;
}

function headerOf(value: unknown): ThemeCssHeader {
  return value === "neutral" || value === "secondary" ? value : "primary";
}

/** gray-900: the app's near-black text and the footer's dark ground. */
const GRAY_900 = "#101828";

/**
 * The neutral header is fixed per colour mode and computes nothing: white with
 * the app's near-black text (gray-900) in light, and in dark the footer's
 * ground (`bg-gray-900`) with white text. Opaque on purpose, see the iOS note
 * in `NavigationBar.vue`.
 */
const NEUTRAL_HEADER = {
  light: { bar: WHITE, contrast: GRAY_900 },
  dark: { bar: GRAY_900, contrast: WHITE },
} as const;

/**
 * The solid button on the header bar ("Register"). On a coloured bar it stays
 * as it always was, white in light and black in dark. On the neutral bar that
 * would vanish into the bar, so it takes the bar's text colour as its ground.
 */
const HEADER_BUTTON = {
  coloured: {
    light: { button: WHITE, contrast: BLACK },
    dark: { button: BLACK, contrast: WHITE },
  },
  neutral: {
    light: { button: GRAY_900, contrast: WHITE },
    dark: { button: WHITE, contrast: GRAY_900 },
  },
} as const;

function render(
  colors: ColorPair,
  accent: string | null,
  header: ThemeCssHeader,
): string {
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
  // No accent, no declaration: every element that wears the accent falls
  // back on its own, through `var(--ui-accent, …)`, to what it wore before.
  if (accent) {
    colorDeclarations.push(
      `  --ui-accent: ${accent};`,
      `  --ui-accent-contrast: ${contrastOf(accent)};`,
    );
  }
  const activeTab = [
    `  --ui-header-active: ${active};`,
    `  --ui-header-active-contrast: ${contrastOf(active)};`,
    `  --ui-header-active-stripe: ${stripe};`,
  ];

  const headerIn = (mode: keyof typeof NEUTRAL_HEADER): string[] => {
    const { button, contrast: buttonContrast } =
      HEADER_BUTTON[header === "neutral" ? "neutral" : "coloured"][mode];
    const buttonDeclarations = [
      `  --ui-header-button: ${button};`,
      `  --ui-header-button-contrast: ${buttonContrast};`,
    ];
    if (header === "neutral") {
      const { bar, contrast } = NEUTRAL_HEADER[mode];
      return [
        `  --ui-header: ${bar};`,
        `  --ui-header-contrast: ${contrast};`,
        ...buttonDeclarations,
      ];
    }
    const bar = header === "secondary" ? colors.secondary : colors.primary;
    return [
      `  --ui-header: ${bar};`,
      `  --ui-header-contrast: ${contrastOf(bar)};`,
      ...buttonDeclarations,
    ];
  };

  const block = (mode: keyof typeof NEUTRAL_HEADER): string =>
    [...colorDeclarations, ...headerIn(mode), ...activeTab].join("\n");
  return `:root {\n${block("light")}\n}\n.dark {\n${block("dark")}\n}\n`;
}

/** The family every instance font is declared under, whatever its name. */
const FONT_FAMILY = '"Theme Font"';

/** Tailwind's `--font-sans`, the stack the storefront has always set in. */
const TODAYS_SANS_STACK =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

/**
 * What a font URL may consist of. The storefront builds every one of them, so
 * this is a second line behind that, in the spirit of `SAFE_COLOR`: no quote,
 * backslash, parenthesis or semicolon ever reaches `url("…")`.
 */
const SAFE_FONT_URL = /^\/[A-Za-z0-9._~%/?=&-]{1,512}$/;
/** The name of a system font in `local("…")` and of a fallback family. */
const SAFE_FONT_NAME = /^[A-Za-z0-9 ]{1,64}$/;

const isWeight = (value: unknown): boolean =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 1000;
const isPercent = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1000;

function isSafeFont(font: ThemeFont): boolean {
  return (
    font.faces.length > 0 &&
    font.faces.every(
      (face) =>
        SAFE_FONT_URL.test(face.src) &&
        (face.style === "normal" || face.style === "italic") &&
        (face.weight === null || face.weight.every(isWeight)),
    ) &&
    font.fallbacks.every(
      (face) =>
        SAFE_FONT_NAME.test(face.family) &&
        SAFE_FONT_NAME.test(face.local) &&
        [face.sizeAdjust, face.ascentOverride, face.descentOverride, face.lineGapOverride].every(isPercent),
    )
  );
}

/**
 * The font's faces, its fallbacks and `--font-sans`. `font-display: optional`
 * never swaps a late font in, so nothing on the page moves; the preload in
 * the document head is what lets the font make the first paint at all. A
 * weight range comes from the file's `wght` axis, so 300 to 800 are real
 * weights and the browser synthesises no bold.
 */
function renderFont(font: ThemeFont): string {
  const faces = font.faces.map((face) =>
    [
      "@font-face {",
      `  font-family: ${FONT_FAMILY};`,
      `  src: url("${face.src}") format("woff2");`,
      `  font-weight: ${face.weight ? face.weight.join(" ") : "400"};`,
      `  font-style: ${face.style};`,
      "  font-display: optional;",
      "}",
    ].join("\n"),
  );
  const fallbacks = font.fallbacks.map((face) =>
    [
      "@font-face {",
      `  font-family: "${face.family}";`,
      `  src: local("${face.local}");`,
      `  size-adjust: ${face.sizeAdjust}%;`,
      `  ascent-override: ${face.ascentOverride}%;`,
      `  descent-override: ${face.descentOverride}%;`,
      `  line-gap-override: ${face.lineGapOverride}%;`,
      "}",
    ].join("\n"),
  );
  // Unlayered, so it wins over Tailwind's `--font-sans` in `@layer theme`.
  const stack = [
    FONT_FAMILY,
    ...font.fallbacks.map((face) => `"${face.family}"`),
    TODAYS_SANS_STACK,
  ].join(", ");

  return `${[...faces, ...fallbacks].join("\n")}\n:root {\n  --font-sans: ${stack};\n}\n`;
}

/**
 * The stylesheet for one Theme Bundle.
 *
 * @param input - The bundle's etag, colours, header and font, plus the
 *   route's own defaults.
 * @returns The CSS text, rendered once per etag, set of defaults and font. A
 *   font is part of the key because an uploaded one can fail to load once and
 *   arrive on the next request under the same etag.
 */
export function renderThemeCss(input: RenderThemeCssInput): string {
  const { etag, colors, header, defaults } = input;
  const font = input.font && isSafeFont(input.font) ? input.font : null;
  const key = `${etag}::${defaults.primary}::${defaults.secondary}::${font?.href ?? ""}`;

  const memoised = rendered.get(key);
  if (memoised !== undefined) return memoised;

  const colorsCss = render(
    isSafeColorPair(colors) ? (colors as ColorPair) : defaults,
    accentOf(colors),
    headerOf(header),
  );
  return rendered.set(key, font ? colorsCss + renderFont(font) : colorsCss);
}

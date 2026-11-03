/**
 * The framework-free half of the Hero: which Hero Layout renders, how tall
 * it is in the current Hero mode, and which of its Blocks land where. The
 * Hero components only read the answers; the classes they paint with live
 * in `app/components/hero/heroClasses.ts`.
 */

import type {
  HeroAppLogoReference,
  HeroBlock,
  HeroHeight,
  HeroImageAddress,
  HeroLayout,
  HeroMediaReference,
  HeroZone,
  LocalizedString,
} from "~~/shared/types/hero";
import type { HeroMode } from "~/composables/useHeroMode";

/** What the Fallback Hero Layout is built from at render time. */
export interface FallbackHeroContent {
  /** The title Block's text; the Block is left out when it is empty. */
  title: string;
  subtitle: string;
  /** The app logo; the logo Block is left out when none is known. */
  logo: HeroMediaReference | null;
  /** The app logo's variant for the dark mode, or `null`. */
  logoDark: HeroMediaReference | null;
}

/**
 * The fields every Block of the Fallback Hero Layout shares. Nothing fills
 * defaults here — the Fallback is built, not parsed — so this list has to
 * stay level with the contract's own defaults by hand.
 */
const FALLBACK_BLOCK = {
  outerSpacing: "none",
  innerSpacing: "none",
  width: "auto",
  align: "auto",
  panel: null,
  offset: { x: 0, y: 0 },
  layer: "back",
  homeOnly: false,
  hideOnMobile: false,
} as const;

/** The address and the dimensions of a medium, without the reference around them. */
function imageAddress(
  image: HeroMediaReference,
): Partial<HeroImageAddress> {
  const { url, width, height } = image;
  return {
    ...(url ? { url } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

/**
 * A reference to the app logo with the app logo put in, as the backend's
 * export puts it in: the logo's address and dimensions and, under `dark`, the
 * variant's. Without a logo it carries none, and the Block shows nothing; a
 * variant alone is no app logo either.
 */
export function appLogoReference(
  logo: HeroMediaReference | null,
  logoDark: HeroMediaReference | null,
): HeroAppLogoReference {
  if (!logo?.url) return { source: "app-logo" };

  const reference: HeroAppLogoReference = {
    source: "app-logo",
    ...imageAddress(logo),
  };
  if (logoDark?.url) {
    reference.dark = { ...imageAddress(logoDark), url: logoDark.url };
  }
  return reference;
}

/**
 * The Hero Layout rendered when no Theme Bundle could be read or the one
 * delivered failed validation. It has the shape of the backend's Default
 * Hero Layout — logo on the right, title and subtitle on the left — so the
 * Hero looks the same whether the backend derived it or the storefront did.
 * The logo comes first so it stacks above the title on mobile. Like the
 * backend's, the logo Block follows the app logo: its variant in the dark
 * mode, or inverted without one.
 */
export function fallbackHeroLayout(content: FallbackHeroContent): HeroLayout {
  const blocks: HeroBlock[] = [];

  if (content.logo) {
    blocks.push({
      ...FALLBACK_BLOCK,
      id: "default-logo",
      type: "image",
      zone: "middle-right",
      image: appLogoReference(content.logo, content.logoDark),
      alt: { de: content.title },
      maxHeight: "sm",
    });
  }

  if (content.title) {
    blocks.push({
      ...FALLBACK_BLOCK,
      id: "default-title",
      type: "text",
      zone: "middle-left",
      text: { de: content.title },
      size: "lg",
      color: "primary",
      weight: "bold",
      shadow: false,
    });
  }

  blocks.push({
    ...FALLBACK_BLOCK,
    id: "default-subtitle",
    type: "text",
    zone: "middle-left",
    text: { de: content.subtitle },
    size: "2xl",
    color: "default",
    weight: "bold",
    shadow: false,
  });

  return {
    version: 1,
    height: "lg",
    mobileHeight: "lg",
    compactHeight: "sm",
    blocks,
  };
}

/** The height step of the Hero from the `md` breakpoint up and below it. */
export interface HeroHeightSteps {
  desktop: HeroHeight;
  mobile: HeroHeight;
}

/**
 * How tall the Hero is in the given mode. The home Hero has a desktop and a
 * mobile height of its own; the Compact Hero has one height on every viewport
 * and ignores `mobileHeight`.
 */
export function heroHeightSteps(
  layout: HeroLayout,
  mode: HeroMode,
): HeroHeightSteps {
  if (mode === "compact") {
    return { desktop: layout.compactHeight, mobile: layout.compactHeight };
  }
  return { desktop: layout.height, mobile: layout.mobileHeight };
}

/**
 * The Blocks the Hero shows in the given mode, in array order — the Compact
 * Hero hides the ones marked home-only.
 */
export function visibleBlocks(layout: HeroLayout, mode: HeroMode): HeroBlock[] {
  if (mode === "home") return layout.blocks;
  return layout.blocks.filter((block) => !block.homeOnly);
}

/**
 * The image Block whose fetch goes first: the first one in array order among
 * the shown Blocks. It gets a high fetch priority; no Block gets a preload
 * hint. `null` when none is shown.
 */
export function firstImageBlockId(blocks: readonly HeroBlock[]): string | null {
  return blocks.find((block) => block.type === "image")?.id ?? null;
}

/** A Zone is a row and a column: `top-left` is the `top` row, `left` column. */
export type HeroZoneRow = "top" | "middle" | "bottom";

export type HeroZoneColumn = "left" | "center" | "right";

/** The row a Zone sits in — what groups its Blocks on mobile. */
export function zoneRow(zone: HeroZone): HeroZoneRow {
  return zone.split("-")[0] as HeroZoneRow;
}

/** The column a Zone sits in — what its Blocks align to on desktop. */
export function zoneColumn(zone: HeroZone): HeroZoneColumn {
  return zone.split("-")[1] as HeroZoneColumn;
}

/** The Blocks anchored in one Zone, in array order — their stacking order. */
export function blocksInZone(blocks: readonly HeroBlock[], zone: HeroZone): HeroBlock[] {
  return blocks.filter((block) => block.zone === zone);
}

/** One of the three row groups of the mobile tree. */
export interface HeroMobileRow {
  row: HeroZoneRow;
  blocks: HeroBlock[];
}

const ZONE_ROWS: readonly HeroZoneRow[] = ["top", "middle", "bottom"];

/**
 * The mobile tree: Blocks grouped by the row of their Zone, array order
 * inside a row, Blocks marked hide-on-mobile left out. The column of the
 * Zone plays no part — everything is centred on mobile.
 */
export function mobileRows(blocks: readonly HeroBlock[]): HeroMobileRow[] {
  const shown = blocks.filter((block) => !block.hideOnMobile);
  return ZONE_ROWS.map((row) => ({
    row,
    blocks: shown.filter((block) => zoneRow(block.zone) === row),
  }));
}

/** The storefront's locales — the keys of a localised string. */
export type HeroLocale = keyof LocalizedString;

/** The text for the current locale; English falls back to German. */
export function localizedText(text: LocalizedString, locale: string): string {
  return text[locale as HeroLocale] || text.de;
}

/**
 * The framework-free half of the Hero: which Hero Layout renders, how tall
 * it is in the current Hero mode, and which of its Blocks land where. The
 * Hero components only read the answers; the classes they paint with live
 * in `app/components/hero/heroClasses.ts`.
 */

import type {
  HeroBlock,
  HeroHeight,
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
  /** The logo Block's image; the Block is left out when none is known. */
  logo: HeroMediaReference | null;
}

/** The fields every Block of the Fallback Hero Layout shares. */
const FALLBACK_BLOCK = {
  outerSpacing: "none",
  innerSpacing: "none",
  width: "auto",
  panel: "none",
  homeOnly: false,
  hideOnMobile: false,
} as const;

/**
 * The Hero Layout rendered when no Theme Bundle could be read or the one
 * delivered failed validation. It has the shape of the backend's Default
 * Hero Layout — logo on the right, title and subtitle on the left — so the
 * Hero looks the same whether the backend derived it or the storefront did.
 * The logo comes first so it stacks above the title on mobile.
 */
export function fallbackHeroLayout(content: FallbackHeroContent): HeroLayout {
  const blocks: HeroBlock[] = [];

  if (content.logo) {
    blocks.push({
      ...FALLBACK_BLOCK,
      id: "default-logo",
      type: "image",
      zone: "middle-right",
      image: content.logo,
      alt: { de: content.title },
      maxHeight: "sm",
      invertInDarkMode: true,
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

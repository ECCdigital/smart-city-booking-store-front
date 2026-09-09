/**
 * The scales of the Hero Layout as Tailwind classes, and what a Block wears.
 *
 * Every table maps one enum of the Shared contract to a complete class
 * literal, so the build sees every class it has to emit and nothing is
 * assembled at runtime — no safelist, no template holes. The values come
 * 1:1 from the contract's "Rendering semantics"; a value that changes here
 * changes the look the admin's Live Preview promised.
 *
 * Mobile and desktop are told apart by CSS alone (`md:`), never by a
 * JavaScript breakpoint: both trees are in the server-rendered HTML, and a
 * breakpoint decided in JavaScript would render the desktop tree on the
 * server and hydrate wrong.
 */

import type {
  HeroBlock,
  HeroBlockWidth,
  HeroColorToken,
  HeroHeight,
  HeroImageBlock,
  HeroImageMaxHeight,
  HeroRichtextBlock,
  HeroSpacing,
  HeroTextBlock,
  HeroTextSize,
  HeroZone,
} from "~~/shared/types/hero";
import { isHeroColorToken } from "~~/shared/utils/heroLayout";
import type { HeroMode } from "~/composables/useHeroMode";
import type { HeroZoneColumn, HeroZoneRow } from "~/utils/heroBlocks";

/** Height steps as the outer height from the `md` breakpoint up: 12 / 16 / 24 / 32 rem. */
export const HERO_DESKTOP_HEIGHT_CLASSES: Record<HeroHeight, string> = {
  sm: "md:h-48",
  md: "md:h-64",
  lg: "md:h-96",
  xl: "md:h-[32rem]",
};

/** The same steps below `md`. */
export const HERO_MOBILE_HEIGHT_CLASSES: Record<HeroHeight, string> = {
  sm: "h-48",
  md: "h-64",
  lg: "h-96",
  xl: "h-[32rem]",
};

/** The steps as CSS lengths — what an image Background's `sizes` is computed from. */
export const HERO_HEIGHT_LENGTHS: Record<HeroHeight, string> = {
  sm: "12rem",
  md: "16rem",
  lg: "24rem",
  xl: "32rem",
};

/**
 * The nine anchor boxes inside the content area. Each spans the full
 * content width so `width: full` on a Block means the whole content area;
 * the column alignment then places a narrower Block inside it. The middle
 * row is centred through a translate, as the contract says.
 */
export const HERO_ANCHOR_CLASSES: Record<HeroZone, string> = {
  "top-left": "top-0 inset-x-0",
  "top-center": "top-0 inset-x-0",
  "top-right": "top-0 inset-x-0",
  "middle-left": "top-1/2 inset-x-0 -translate-y-1/2",
  "middle-center": "top-1/2 inset-x-0 -translate-y-1/2",
  "middle-right": "top-1/2 inset-x-0 -translate-y-1/2",
  "bottom-left": "bottom-0 inset-x-0",
  "bottom-center": "bottom-0 inset-x-0",
  "bottom-right": "bottom-0 inset-x-0",
};

/** How the Blocks of a Zone line up inside their anchor box, by column. */
export const HERO_COLUMN_ALIGN_CLASSES: Record<HeroZoneColumn, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

/** Where a mobile row group sits in its track: top at the top, middle centred, bottom at the bottom. */
export const HERO_ROW_JUSTIFY_CLASSES: Record<HeroZoneRow, string> = {
  top: "justify-start",
  middle: "justify-center",
  bottom: "justify-end",
};

/** Outer spacing: 0 / 0.5 / 1 / 1.5 / 2 / 3 rem, all sides. */
export const HERO_OUTER_SPACING_CLASSES: Record<HeroSpacing, string> = {
  none: "m-0",
  xs: "m-2",
  sm: "m-4",
  md: "m-6",
  lg: "m-8",
  xl: "m-12",
};

/** Inner spacing: the same scale as padding. */
export const HERO_INNER_SPACING_CLASSES: Record<HeroSpacing, string> = {
  none: "p-0",
  xs: "p-2",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
};

/** Block width: auto / 20 / 32 / 48 rem / the whole content width. */
export const HERO_WIDTH_CLASSES: Record<HeroBlockWidth, string> = {
  auto: "w-auto",
  sm: "w-80",
  md: "w-[32rem]",
  lg: "w-[48rem]",
  full: "w-full",
};

/**
 * The six text steps, mobile / desktop. The Compact Hero renders every step
 * one down; the smallest has nowhere to go and stays `text-xs`.
 */
export const HERO_TEXT_SIZE_CLASSES: Record<
  HeroMode,
  Record<HeroTextSize, string>
> = {
  home: {
    xs: "text-xs md:text-sm",
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-2xl",
    xl: "text-xl md:text-3xl",
    "2xl": "text-2xl md:text-5xl",
  },
  compact: {
    xs: "text-xs",
    sm: "text-xs md:text-sm",
    md: "text-sm md:text-base",
    lg: "text-base md:text-lg",
    xl: "text-lg md:text-2xl",
    "2xl": "text-xl md:text-3xl",
  },
};

/** Image max height: 2 / 3.5 / 6 / 10 / 16 rem — the cap for a measured image. */
export const HERO_IMAGE_MAX_HEIGHT_CLASSES: Record<HeroImageMaxHeight, string> = {
  xs: "max-h-8",
  sm: "max-h-14",
  md: "max-h-24",
  lg: "max-h-40",
  xl: "max-h-64",
};

/**
 * The same steps as a fixed height — what an image without dimensions
 * reserves, since a cap alone reserves nothing before the image arrives.
 */
export const HERO_IMAGE_HEIGHT_CLASSES: Record<HeroImageMaxHeight, string> = {
  xs: "h-8",
  sm: "h-14",
  md: "h-24",
  lg: "h-40",
  xl: "h-64",
};

/**
 * The named colours. `primary` and `secondary` are the theme's colours from
 * the stylesheet route; a hex colour is the one text value that goes inline.
 */
export const HERO_COLOR_CLASSES: Record<HeroColorToken, string> = {
  default: "text-black dark:text-white",
  primary: "text-primary",
  secondary: "text-secondary",
  white: "text-white",
};

/** `panel: translucent` is the glass panel behind a Block. */
const PANEL_CLASSES = "glass rounded-xl";

/**
 * The classes of a Block's box, whatever its type: its spacing, its width
 * and its panel. `max-w-full` keeps a wide Block inside the content area.
 */
export function blockBoxClasses(block: HeroBlock): string[] {
  const classes = [
    "max-w-full min-w-0",
    HERO_OUTER_SPACING_CLASSES[block.outerSpacing],
    HERO_INNER_SPACING_CLASSES[block.innerSpacing],
    HERO_WIDTH_CLASSES[block.width],
  ];
  if (block.panel === "translucent") classes.push(PANEL_CLASSES);
  return classes;
}

/** The readability toggle: a shadow that lifts text off a busy Background. */
const TEXT_SHADOW_CLASS = "[text-shadow:0_1px_3px_rgba(0,0,0,0.6)]";

/** A text or rich-text Block: what carries a colour and the shadow toggle. */
type HeroCopyBlock = HeroTextBlock | HeroRichtextBlock;

/**
 * A named colour as a class and the shadow, shared by text and rich text.
 * A hex colour is not a class — it is the one text value that goes inline,
 * see {@link blockColorStyle}.
 */
function copyClasses(block: HeroCopyBlock): string[] {
  const classes: string[] = [];
  if (isHeroColorToken(block.color)) classes.push(HERO_COLOR_CLASSES[block.color]);
  if (block.shadow) classes.push(TEXT_SHADOW_CLASS);
  return classes;
}

/**
 * The classes a text Block's element carries: its size for the mode, its
 * weight, a named colour and the shadow.
 */
export function textBlockClasses(block: HeroTextBlock, mode: HeroMode): string[] {
  return [
    HERO_TEXT_SIZE_CLASSES[mode][block.size],
    block.weight === "bold" ? "font-bold" : "font-normal",
    ...copyClasses(block),
  ];
}

/**
 * The hook the stylesheet rule hangs on: `.hero-richtext` in `main.css`
 * styles the tags of the allowlist — paragraphs, lists, links — which no
 * utility class can reach inside `v-html` markup.
 */
export const RICHTEXT_CLASS = "hero-richtext";

/** Rich text has no `size` of its own: it is body copy and renders at the default text step. */
const RICHTEXT_SIZE: HeroTextSize = "md";

/**
 * The classes a rich-text Block's root carries: the stylesheet hook, the
 * body-copy step for the mode — one step down in the Compact Hero, like
 * every text — a named colour and the shadow. Colour and shadow inherit into
 * the markup, so a link or a list item is painted like the copy around it.
 */
export function richtextBlockClasses(
  block: HeroRichtextBlock,
  mode: HeroMode,
): string[] {
  return [
    RICHTEXT_CLASS,
    HERO_TEXT_SIZE_CLASSES[mode][RICHTEXT_SIZE],
    ...copyClasses(block),
  ];
}

/** The inline style of a text or rich-text Block: its hex colour, or nothing at all. */
export function blockColorStyle(
  block: HeroCopyBlock,
): Record<string, string> | undefined {
  return isHeroColorToken(block.color) ? undefined : { color: block.color };
}

/** What an image is rendered from: its reference, its height step and the dark-mode toggle. */
export type HeroImageOptions = Pick<
  HeroImageBlock,
  "image" | "maxHeight" | "invertInDarkMode"
>;

/** A dark logo on a dark page: inverted, with the hue turned back. */
const INVERT_CLASSES = "dark:invert dark:hue-rotate-180";

/** Whether the reference carries the medium's dimensions — what the box is reserved from. */
function isMeasured(image: HeroImageOptions["image"]): boolean {
  return Boolean(image.width && image.height);
}

/**
 * The classes of an image element — the Hero's image Blocks and the logo on
 * the auth pages alike. The width always follows the aspect ratio; a wider
 * image than its container is shown whole rather than stretched.
 *
 * A measured image is capped at its height step and reserves its box from
 * its own dimensions (see {@link imageStyle}). An unmeasured one has no
 * ratio to reserve from, so it takes the step as a fixed height and accepts
 * that its width settles when the image arrives.
 */
export function imageClasses(options: HeroImageOptions): string[] {
  const classes = [
    "w-auto max-w-full object-contain",
    isMeasured(options.image)
      ? HERO_IMAGE_MAX_HEIGHT_CLASSES[options.maxHeight]
      : HERO_IMAGE_HEIGHT_CLASSES[options.maxHeight],
  ];
  if (options.invertInDarkMode) classes.push(INVERT_CLASSES);
  return classes;
}

/**
 * The inline style of an image: its own height, or nothing at all.
 *
 * The `height` attribute alone would reserve the box, but Tailwind's
 * preflight sets `height: auto` on every image and so throws the attribute
 * away — with both axes auto, a pending image is 0 × 0 until it arrives.
 * Restating the height inline keeps the box definite: `max-h` caps it and
 * the width follows the ratio the `width`/`height` attributes declare.
 */
export function imageStyle(
  options: HeroImageOptions,
): Record<string, string> | undefined {
  return isMeasured(options.image)
    ? { height: `${options.image.height}px` }
    : undefined;
}

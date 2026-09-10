/**
 * The scales of the Hero Layout as Tailwind classes, and what a Block wears.
 *
 * Every table maps one enum of the Shared contract to a complete class
 * literal, so the build sees every class it has to emit and nothing is
 * assembled at runtime — no safelist, no template holes. The values come
 * 1:1 from the contract's "Rendering semantics"; a value that changes here
 * changes the look the admin's Live Preview promised.
 *
 * Two things here have no class literal to be and go inline instead: a text
 * colour the author typed as a hex value, and a Panel's fill — a colour at an
 * arbitrary percentage. They are two of the seven runtime values the contract
 * allows inline; the rest live on the Background, on an image and inside
 * rendered rich text.
 *
 * Mobile and desktop are told apart by CSS alone (`md:`), never by a
 * JavaScript breakpoint: both trees are in the server-rendered HTML, and a
 * breakpoint decided in JavaScript would render the desktop tree on the
 * server and hydrate wrong.
 */

import type {
  HeroBlock,
  HeroBlockAlignment,
  HeroBlockOffset,
  HeroBlockWidth,
  HeroColorToken,
  HeroHeight,
  HeroImageBlock,
  HeroImageMaxHeight,
  HeroPanel,
  HeroPanelColorToken,
  HeroPanelRadius,
  HeroRichtextBlock,
  HeroSpacing,
  HeroTextBlock,
  HeroTextSize,
  HeroZone,
} from "~~/shared/types/hero";
import {
  isHeroColorToken,
  isHeroPanelColorToken,
} from "~~/shared/utils/heroLayout";
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
 * the column alignment then places a narrower Block inside it.
 *
 * The middle row spans the content height and centres its stack with
 * `justify-center` — deliberately **not** with the `top-1/2 -translate-y-1/2`
 * it used to, and not with any other transform: a transformed element is a
 * stacking context, so a `front` Block inside such an anchor would be trapped
 * in it, able to out-paint its own stack siblings but never a Block in
 * another Zone. Centring by free space is the same picture — a stack taller
 * than the content area overflows both ways either way, as the mobile tree's
 * middle row has done all along in a track of exactly this kind — and it
 * leaves the Layer meaning one thing everywhere.
 */
export const HERO_ANCHOR_CLASSES: Record<HeroZone, string> = {
  "top-left": "top-0 inset-x-0",
  "top-center": "top-0 inset-x-0",
  "top-right": "top-0 inset-x-0",
  "middle-left": "inset-y-0 inset-x-0 justify-center",
  "middle-center": "inset-y-0 inset-x-0 justify-center",
  "middle-right": "inset-y-0 inset-x-0 justify-center",
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
 * The horizontal Offset steps: −3 … 3 rem on the 0.5 grid, thirteen of them,
 * positive to the right. Every literal carries `md:`, and that alone is the
 * whole of the contract's "`x` is ignored below `md`" — the same Block
 * element sits in both trees, and the mobile one simply never applies the
 * class. No per-tree prop, no JavaScript breakpoint.
 *
 * The zero step is in the table with the others and is empty on purpose: a
 * Block nobody moved has to come out exactly as it did before the field
 * existed, so there is nothing to emit for it — and nothing to undo either,
 * since an axis without a class keeps the `0` its custom property starts at.
 */
export const HERO_OFFSET_X_CLASSES: Record<number, string> = {
  "-3": "md:-translate-x-[3rem]",
  "-2.5": "md:-translate-x-[2.5rem]",
  "-2": "md:-translate-x-[2rem]",
  "-1.5": "md:-translate-x-[1.5rem]",
  "-1": "md:-translate-x-[1rem]",
  "-0.5": "md:-translate-x-[0.5rem]",
  "0": "",
  "0.5": "md:translate-x-[0.5rem]",
  "1": "md:translate-x-[1rem]",
  "1.5": "md:translate-x-[1.5rem]",
  "2": "md:translate-x-[2rem]",
  "2.5": "md:translate-x-[2.5rem]",
  "3": "md:translate-x-[3rem]",
};

/** The same thirteen steps vertically, positive downwards and on every viewport. */
export const HERO_OFFSET_Y_CLASSES: Record<number, string> = {
  "-3": "-translate-y-[3rem]",
  "-2.5": "-translate-y-[2.5rem]",
  "-2": "-translate-y-[2rem]",
  "-1.5": "-translate-y-[1.5rem]",
  "-1": "-translate-y-[1rem]",
  "-0.5": "-translate-y-[0.5rem]",
  "0": "",
  "0.5": "translate-y-[0.5rem]",
  "1": "translate-y-[1rem]",
  "1.5": "translate-y-[1.5rem]",
  "2": "translate-y-[2rem]",
  "2.5": "translate-y-[2.5rem]",
  "3": "translate-y-[3rem]",
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

/**
 * A Panel's corner radius per step: 0 / 0.375 / 0.75 / 1.5 rem and a pill at
 * the theme's own `--ui-radius`, which is what every `rounded-*` in Nuxt UI
 * resolves against. The step names and the class names deliberately do not
 * line up — `sm` is `rounded-md` — because the contract names five steps of
 * its own and picks the Tailwind class each one lands on.
 */
export const HERO_PANEL_RADIUS_CLASSES: Record<HeroPanelRadius, string> = {
  none: "rounded-none",
  sm: "rounded-md",
  md: "rounded-xl",
  lg: "rounded-3xl",
  full: "rounded-full",
};

/** The frosting of what lies behind a Panel: 16 px, no steps. */
const PANEL_BLUR_CLASS = "backdrop-blur-lg";

/**
 * What a Panel wears as classes: its radius, and the blur when it asks for
 * one. The fill is not here — a colour at an arbitrary percentage cannot be a
 * class literal, so it goes inline, see {@link blockPanelStyle}.
 *
 * At full opacity the backdrop filter is dropped: nothing behind an opaque
 * fill can show through it, so it would buy a compositing layer and paint
 * nothing.
 */
function panelClasses(panel: HeroPanel): string[] {
  const classes = [HERO_PANEL_RADIUS_CLASSES[panel.radius]];
  if (panel.blur && panel.opacity < 100) classes.push(PANEL_BLUR_CLASS);
  return classes;
}

/**
 * What a Panel's named colours resolve to. `primary` and `secondary` are the
 * two custom properties the stylesheet route declares
 * (`server/utils/themeCss.ts`), so a Panel follows the instance's branding
 * the way `text-primary` does. A Panel has no `default`: it is
 * mode-independent and so has nothing to follow.
 */
const HERO_PANEL_COLOR_VALUES: Record<HeroPanelColorToken, string> = {
  // `white` at 60 % is what „Glas“ is made of, and it stands in for the
  // `bg-slate-50/60` of today's `.glass` — 4/255 per channel apart, which no
  // eye finds in a side-by-side. The dark half of `.glass` has no counterpart
  // here and that is not an oversight: a Panel is mode-independent by
  // decision, so an author who wants a dark Panel picks `black`.
  white: "#ffffff",
  black: "#000000",
  primary: "var(--ui-primary)",
  secondary: "var(--ui-secondary)",
};

/**
 * A Panel's fill: its colour at its opacity, as `background-color`.
 *
 * Deliberately not the `opacity` property, which would fade the Block's text
 * and image along with the surface behind them. `color-mix` gives the alpha
 * to the colour itself and takes a token, a custom property and a hex value
 * the same way — `0%` mixes to fully transparent and `100%` to the colour as
 * given, so both ends of the scale come out right without a special case.
 */
function panelFill(panel: HeroPanel): string {
  const color = isHeroPanelColorToken(panel.color)
    ? HERO_PANEL_COLOR_VALUES[panel.color]
    : panel.color;
  return `color-mix(in srgb, ${color} ${panel.opacity}%, transparent)`;
}

/**
 * The inline style of a Block's box: its Panel's fill, or nothing at all.
 *
 * The fill is one of the runtime values named at the top of this file: a
 * colour at an arbitrary percentage has no class literal to be. Radius and
 * blur do, and stay in {@link blockBoxClasses}.
 */
export function blockPanelStyle(
  block: HeroBlock,
): Record<string, string> | undefined {
  return block.panel ? { backgroundColor: panelFill(block.panel) } : undefined;
}

/**
 * What `layer: "front"` is, and the whole of it: a Block is a flex item of
 * its Zone's stack, so a `z-index` orders it without a `position` of its
 * own. It lifts the Block above the Blocks it overlaps in **every** Zone —
 * which holds only because no anchor is a stacking context, see
 * {@link HERO_ANCHOR_CLASSES}. `back` wears nothing, and among equals
 * document order decides, as it always has.
 */
const FRONT_LAYER_CLASS = "z-10";

/**
 * The Offset as classes: the step of each axis that has one. A translate is
 * applied at paint time and changes no box in the flow, so the Block moves
 * alone — its stack neighbours, the other Zones and the mobile row groups
 * stay exactly where they are.
 *
 * A step of zero has no class, which is why this can return one class, two
 * or none at all — as does a step off the 0.5 grid, which the guard does not
 * let through in the first place. The two axes compose: each writes its own
 * custom property and both write the same `translate`, so `x` on its own
 * still translates by the `0` the `y` property starts at.
 *
 * The one thing a translate does change is paint order, and it is worth
 * knowing: a translated element is a stacking context of its own and joins
 * the Blocks that paint at `z-index: 0`, so an offset Block rises above a
 * later, unmoved Block of its **own** Zone stack. Across Zones nothing moves
 * — the anchor it sits in still decides — and inside a Zone the two Blocks
 * are only on top of each other because the Offset put them there.
 */
function offsetClasses(offset: HeroBlockOffset): string[] {
  const classes: string[] = [];
  const x = HERO_OFFSET_X_CLASSES[offset.x];
  const y = HERO_OFFSET_Y_CLASSES[offset.y];
  if (x) classes.push(x);
  if (y) classes.push(y);
  return classes;
}

/**
 * A table of the three alignments an author can name. `auto` is in none of
 * them, because it has nothing to emit — see {@link alignClasses}.
 */
type HeroAlignClasses = Record<Exclude<HeroBlockAlignment, "auto">, string>;

/**
 * The named alignments as the property that carries them for a line of copy:
 * `text-align`, inherited by everything inside the box.
 */
const HERO_ALIGN_TEXT_CLASSES: HeroAlignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * What `align` emits from one of the two tables, and the one place that says
 * `auto` emits **nothing** at all.
 *
 * That is the whole of "follows the Zone column". The anchor already declares
 * the column's `text-align` and the mobile row group its `text-center` (see
 * {@link HERO_COLUMN_ALIGN_CLASSES}), and a Block that declares none of its
 * own inherits whichever of the two is showing. Emitting the column's class
 * here instead would say the same thing twice on desktop and the wrong thing
 * on mobile, where there are no columns.
 *
 * The three named values carry no `md:`: they are absolute, so an author who
 * asks for one gets it on a phone too. Only the Block's **box** stays centred
 * there, which is the mobile tree's own doing and not this field's. Nor does
 * either table take a Hero mode: an alignment is not a size and has nothing
 * the Compact Hero could step down.
 */
function alignClasses(
  align: HeroBlockAlignment,
  table: HeroAlignClasses,
): string[] {
  return align === "auto" ? [] : [table[align]];
}

/**
 * The classes of a Block's box, whatever its type: its spacing, its width,
 * the alignment of its lines, its Offset, its Layer and its panel.
 * `max-w-full` keeps a wide Block inside the content area.
 *
 * The box takes no mode. The Compact Hero steps the text sizes down but
 * applies the Offset **as authored**: an Offset is a placement the author
 * chose in rem, and halving it silently would make the compact frame
 * disagree with the form the admin filled in.
 */
export function blockBoxClasses(block: HeroBlock): string[] {
  const classes = [
    "max-w-full min-w-0",
    HERO_OUTER_SPACING_CLASSES[block.outerSpacing],
    HERO_INNER_SPACING_CLASSES[block.innerSpacing],
    HERO_WIDTH_CLASSES[block.width],
    ...alignClasses(block.align, HERO_ALIGN_TEXT_CLASSES),
    ...offsetClasses(block.offset),
  ];
  if (block.layer === "front") classes.push(FRONT_LAYER_CLASS);
  if (block.panel) classes.push(...panelClasses(block.panel));
  return classes;
}

/** The readability toggle: a shadow that lifts text off a busy Background. */
const TEXT_SHADOW_CLASS = "[text-shadow:0_1px_3px_rgba(0,0,0,0.6)]";

/** A text or rich-text Block: what carries a colour and the shadow toggle. */
type HeroCopyBlock = HeroTextBlock | HeroRichtextBlock;

/**
 * `default` on a Panel: the light half of `HERO_COLOR_CLASSES.default`, and
 * the one place that half is written twice — a class literal is not assembled
 * from another one here, whatever it costs in repetition, so a change to the
 * default text colour has to be made in both.
 *
 * A Panel is painted the same in both colour modes, so the copy on it cannot
 * follow the mode either: white text in dark mode would land on a Panel that
 * stayed white. The Block reads its own Panel for this, which is the only
 * thing that can be right — nothing else knows whether the copy sits on a
 * surface.
 */
const PANEL_DEFAULT_COLOR_CLASS = "text-black";

/**
 * A named colour as a class and the shadow, shared by text and rich text.
 * A hex colour is not a class — it is the one text value that goes inline,
 * see {@link blockColorStyle}.
 */
function copyClasses(block: HeroCopyBlock): string[] {
  const classes: string[] = [];
  if (isHeroColorToken(block.color)) {
    classes.push(
      block.color === "default" && block.panel
        ? PANEL_DEFAULT_COLOR_CLASS
        : HERO_COLOR_CLASSES[block.color],
    );
  }
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

/**
 * The Compact Hero, said in the one language the stylesheet understands.
 *
 * A `hero-size-*` run has to step down with the Hero, exactly as the Block's
 * own size does, and the mode is a component prop — nothing CSS can read. So
 * the root carries it as a class and the compact size rules select on it.
 */
export const RICHTEXT_COMPACT_CLASS = "hero-compact";

/**
 * A Panel under the copy, said the same way and for the same reason.
 *
 * {@link copyClasses} settles this for the Block's own colour by reading its
 * Panel, and a `hero-color-default` run inside the markup needs the same
 * answer: black in both modes, because a Panel does not flip. Nothing in the
 * markup knows it sits on a surface, so the root says so.
 *
 * Two hooks rather than one, because they answer two independent questions —
 * a compact Hero may or may not have a Panel — and a single hook would have
 * to spell all four combinations. They live on the rich-text root rather than
 * on the Block's box ({@link blockBoxClasses}) because rendered rich text is
 * the only thing that reads them: a text Block's own copy takes both facts as
 * ordinary classes, having no markup of its own.
 */
export const RICHTEXT_PANEL_CLASS = "hero-on-panel";

/**
 * The classes a rich-text Block's root carries: the stylesheet hook, its own
 * step for the mode — one step down in the Compact Hero, like every text — a
 * named colour and the shadow. Size, colour and shadow inherit into the
 * markup, so a link or a list item is painted like the copy around it, and a
 * run of words that names a step or a colour of its own overrides what it
 * inherited (`.hero-richtext` in `main.css`).
 *
 * The two hooks those rules select on come last, with the rest of what a
 * Block only sometimes wears. Nothing reads the order — a class attribute is
 * a set — so the tests pin it merely to keep the list readable.
 */
export function richtextBlockClasses(
  block: HeroRichtextBlock,
  mode: HeroMode,
): string[] {
  const classes = [
    RICHTEXT_CLASS,
    HERO_TEXT_SIZE_CLASSES[mode][block.size],
    ...copyClasses(block),
  ];
  if (mode === "compact") classes.push(RICHTEXT_COMPACT_CLASS);
  if (block.panel) classes.push(RICHTEXT_PANEL_CLASS);
  return classes;
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

/**
 * The same three alignments for the one thing `text-align` cannot place: the
 * image of an image Block.
 *
 * The preflight makes an image a block-level element, and a block-level box
 * of its own intrinsic width is placed by its margins, not by the
 * `text-align` its copy siblings follow. `left` is where such a box already
 * sits, and its entry says so out loud rather than leaving the table with a
 * hole: unlike an Offset of zero it is a value the author picked, and only
 * `auto` means "emit nothing".
 */
const HERO_ALIGN_IMAGE_CLASSES: HeroAlignClasses = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

/**
 * What an image Block adds to the image element {@link imageClasses}
 * dresses: where the image sits inside the Block's box.
 *
 * It is separate from `imageClasses` because that one is the image element
 * everywhere — the logo above the auth forms renders through it too — and
 * this is a Block's field. And it is separate from {@link blockBoxClasses}
 * because the box aligns its **lines**: an image needs the property its own
 * layout listens to.
 *
 * `auto` emits nothing here as well, and that is a deliberate reading of the
 * contract worth stating: `auto` "follows the Zone column" as far as
 * inheritance carries it, which for an image is nowhere, because a
 * block-level image ignores the `text-align` the column declares. So an
 * `auto` image in a wide box stands at the box's left edge in every Zone —
 * exactly where it stood before this field existed, which is the one thing
 * `auto` may never change. Deriving a margin from the column instead would
 * move an image nobody aligned, and it is the author of a Block wide enough
 * for the difference to show who has the field to say where it goes.
 */
export function imageBlockClasses(block: HeroImageBlock): string[] {
  return alignClasses(block.align, HERO_ALIGN_IMAGE_CLASSES);
}

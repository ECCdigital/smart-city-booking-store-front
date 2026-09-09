import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  blockBoxClasses,
  HERO_ANCHOR_CLASSES,
  HERO_COLOR_CLASSES,
  HERO_COLUMN_ALIGN_CLASSES,
  HERO_DESKTOP_HEIGHT_CLASSES,
  HERO_HEIGHT_LENGTHS,
  HERO_IMAGE_HEIGHT_CLASSES,
  HERO_IMAGE_MAX_HEIGHT_CLASSES,
  HERO_INNER_SPACING_CLASSES,
  HERO_MOBILE_HEIGHT_CLASSES,
  HERO_OUTER_SPACING_CLASSES,
  HERO_ROW_JUSTIFY_CLASSES,
  HERO_TEXT_SIZE_CLASSES,
  HERO_WIDTH_CLASSES,
  blockColorStyle,
  imageClasses,
  imageStyle,
  RICHTEXT_CLASS,
  richtextBlockClasses,
  textBlockClasses,
} from "~/components/hero/heroClasses";
import {
  HERO_COLOR_TOKENS,
  HERO_HEIGHTS,
  HERO_IMAGE_MAX_HEIGHTS,
  HERO_SPACINGS,
  HERO_TEXT_SIZES,
  HERO_ZONES,
  HERO_BLOCK_WIDTHS,
  type HeroBlock,
  type HeroImageBlock,
  type HeroLayout,
  type HeroRichtextBlock,
  type HeroTextBlock,
} from "~~/shared/types/hero";

import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import defaultHeroLayout from "./fixtures/hero-layout/default-hero-layout.json";

/** A Tailwind class list is a literal: no template holes, no empty tokens. */
function isClassLiteral(value: string): boolean {
  return !/[{}$]/.test(value) && !/\s{2,}/.test(value) && value === value.trim();
}

describe("the Hero class tables", () => {
  it("cover every member of every scale of the contract with a class literal", () => {
    const tables: [readonly string[], Record<string, string>][] = [
      [HERO_ZONES, HERO_ANCHOR_CLASSES],
      [HERO_HEIGHTS, HERO_DESKTOP_HEIGHT_CLASSES],
      [HERO_HEIGHTS, HERO_MOBILE_HEIGHT_CLASSES],
      [HERO_SPACINGS, HERO_OUTER_SPACING_CLASSES],
      [HERO_SPACINGS, HERO_INNER_SPACING_CLASSES],
      [HERO_BLOCK_WIDTHS, HERO_WIDTH_CLASSES],
      [HERO_TEXT_SIZES, HERO_TEXT_SIZE_CLASSES.home],
      [HERO_TEXT_SIZES, HERO_TEXT_SIZE_CLASSES.compact],
      [HERO_COLOR_TOKENS, HERO_COLOR_CLASSES],
      [HERO_IMAGE_MAX_HEIGHTS, HERO_IMAGE_MAX_HEIGHT_CLASSES],
      [HERO_IMAGE_MAX_HEIGHTS, HERO_IMAGE_HEIGHT_CLASSES],
      [["left", "center", "right"], HERO_COLUMN_ALIGN_CLASSES],
      [["top", "middle", "bottom"], HERO_ROW_JUSTIFY_CLASSES],
    ];

    for (const [members, table] of tables) {
      expect(Object.keys(table).sort()).toEqual([...members].sort());
      for (const value of Object.values(table)) {
        expect(typeof value).toBe("string");
        expect(isClassLiteral(value)).toBe(true);
      }
    }
  });

  it("reserves the four height steps of the contract on desktop and on mobile", () => {
    // 12 / 16 / 24 / 32 rem — the outer height, as today.
    expect(HERO_DESKTOP_HEIGHT_CLASSES).toEqual({
      sm: "md:h-48",
      md: "md:h-64",
      lg: "md:h-96",
      xl: "md:h-[32rem]",
    });
    expect(HERO_MOBILE_HEIGHT_CLASSES).toEqual({
      sm: "h-48",
      md: "h-64",
      lg: "h-96",
      xl: "h-[32rem]",
    });
    // The lengths an image Background's `sizes` value is computed from.
    expect(HERO_HEIGHT_LENGTHS).toEqual({
      sm: "12rem",
      md: "16rem",
      lg: "24rem",
      xl: "32rem",
    });
  });

  it("renders the text scale of the contract, mobile / desktop", () => {
    expect(HERO_TEXT_SIZE_CLASSES.home).toEqual({
      xs: "text-xs md:text-sm",
      sm: "text-sm md:text-base",
      md: "text-base md:text-lg",
      lg: "text-lg md:text-2xl",
      xl: "text-xl md:text-3xl",
      "2xl": "text-2xl md:text-5xl",
    });
  });

  it("renders every text size one step down in the Compact Hero", () => {
    const { home, compact } = HERO_TEXT_SIZE_CLASSES;
    for (let index = 1; index < HERO_TEXT_SIZES.length; index++) {
      const size = HERO_TEXT_SIZES[index]!;
      const oneDown = HERO_TEXT_SIZES[index - 1]!;
      expect(compact[size]).toBe(home[oneDown]);
    }
    // The smallest step has nowhere to go and stays the smallest size.
    expect(compact.xs).toBe("text-xs");
  });

  it("maps the spacing and width scales 1:1 to the contract's rem values", () => {
    // 0 / 0.5 / 1 / 1.5 / 2 / 3 rem — Tailwind's unit is 0.25 rem.
    expect(HERO_OUTER_SPACING_CLASSES).toEqual({
      none: "m-0",
      xs: "m-2",
      sm: "m-4",
      md: "m-6",
      lg: "m-8",
      xl: "m-12",
    });
    expect(HERO_INNER_SPACING_CLASSES).toEqual({
      none: "p-0",
      xs: "p-2",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-12",
    });
    // auto / 20 / 32 / 48 rem / the whole content width.
    expect(HERO_WIDTH_CLASSES).toEqual({
      auto: "w-auto",
      sm: "w-80",
      md: "w-[32rem]",
      lg: "w-[48rem]",
      full: "w-full",
    });
  });

  it("caps an image at 2 / 3.5 / 6 / 10 / 16 rem, or reserves exactly that height", () => {
    expect(HERO_IMAGE_MAX_HEIGHT_CLASSES).toEqual({
      xs: "max-h-8",
      sm: "max-h-14",
      md: "max-h-24",
      lg: "max-h-40",
      xl: "max-h-64",
    });
    expect(HERO_IMAGE_HEIGHT_CLASSES).toEqual({
      xs: "h-8",
      sm: "h-14",
      md: "h-24",
      lg: "h-40",
      xl: "h-64",
    });
  });

  it("anchors every Zone to its row and column of the content area", () => {
    expect(HERO_ANCHOR_CLASSES["top-left"]).toContain("top-0");
    expect(HERO_ANCHOR_CLASSES["middle-center"]).toContain("top-1/2");
    expect(HERO_ANCHOR_CLASSES["middle-center"]).toContain("-translate-y-1/2");
    expect(HERO_ANCHOR_CLASSES["bottom-right"]).toContain("bottom-0");
    expect(HERO_COLUMN_ALIGN_CLASSES).toEqual({
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    });
  });

  it("paints the named colours from the theme and leaves hex to the inline style", () => {
    expect(HERO_COLOR_CLASSES).toEqual({
      default: "text-black dark:text-white",
      primary: "text-primary",
      secondary: "text-secondary",
      white: "text-white",
    });
  });
});

describe("a Block's box", () => {
  const subtitle = (defaultHeroLayout as HeroLayout).blocks.find(
    (block) => block.id === "default-subtitle",
  ) as HeroBlock;

  it("wears its spacing and width, and stays inside the content area", () => {
    expect(blockBoxClasses(subtitle)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-auto",
    ]);
  });

  it("gets the glass panel only when it asks for it", () => {
    const panelled: HeroBlock = {
      ...subtitle,
      outerSpacing: "md",
      innerSpacing: "sm",
      width: "md",
      panel: "translucent",
    };
    expect(blockBoxClasses(panelled)).toEqual([
      "max-w-full min-w-0",
      "m-6",
      "p-4",
      "w-[32rem]",
      "glass rounded-xl",
    ]);
  });
});

describe("a text Block", () => {
  const subtitle = (defaultHeroLayout as HeroLayout).blocks.find(
    (block) => block.id === "default-subtitle",
  ) as HeroTextBlock;

  it("renders its size for the mode, its weight and a named colour as classes", () => {
    expect(textBlockClasses(subtitle, "home")).toEqual([
      "text-2xl md:text-5xl",
      "font-bold",
      "text-black dark:text-white",
    ]);
    expect(textBlockClasses(subtitle, "compact")).toContain("text-xl md:text-3xl");
    expect(blockColorStyle(subtitle)).toBeUndefined();
  });

  it("renders a hex colour inline and the shadow as a class", () => {
    const badge: HeroTextBlock = {
      ...subtitle,
      size: "md",
      weight: "normal",
      color: "#b91c1c",
      shadow: true,
    };

    const classes = textBlockClasses(badge, "home");
    expect(classes).toContain("text-base md:text-lg");
    expect(classes).toContain("font-normal");
    expect(classes.some((entry) => entry.includes("text-shadow"))).toBe(true);
    expect(classes.some((entry) => entry.includes("#b91c1c"))).toBe(false);
    expect(blockColorStyle(badge)).toEqual({ color: "#b91c1c" });
  });
});

describe("a rich-text Block", () => {
  const openingHours = (crowdedHeroLayout as HeroLayout).blocks.find(
    (block) => block.type === "richtext",
  ) as HeroRichtextBlock;

  it("is body copy: the hook for the stylesheet rule, the md step for the mode, its colour and shadow", () => {
    expect(richtextBlockClasses(openingHours, "home")).toEqual([
      RICHTEXT_CLASS,
      HERO_TEXT_SIZE_CLASSES.home.md,
      "text-white",
      "[text-shadow:0_1px_3px_rgba(0,0,0,0.6)]",
    ]);
    expect(blockColorStyle(openingHours)).toBeUndefined();
  });

  it("renders one step down in the Compact Hero, like every text", () => {
    expect(richtextBlockClasses(openingHours, "compact")).toContain(
      HERO_TEXT_SIZE_CLASSES.compact.md,
    );
  });

  it("renders a hex colour inline and no shadow unless asked", () => {
    const plain: HeroRichtextBlock = {
      ...openingHours,
      color: "#1d4ed8",
      shadow: false,
    };

    const classes = richtextBlockClasses(plain, "home");
    expect(classes).toEqual([RICHTEXT_CLASS, HERO_TEXT_SIZE_CLASSES.home.md]);
    expect(blockColorStyle(plain)).toEqual({ color: "#1d4ed8" });
  });

  it("puts the typography of the allowed tags in one stylesheet rule, not in classes", () => {
    // The markup arrives through `v-html`, so no utility class can reach the
    // tags inside it; `.hero-richtext` in main.css styles them instead. The
    // preflight would otherwise strip the list markers and the link underline.
    const stylesheet = readFileSync("app/assets/css/main.css", "utf8");

    for (const tag of ["p", "ul", "ol", "li", "a"]) {
      expect(stylesheet).toMatch(
        new RegExp(String.raw`\.${RICHTEXT_CLASS}[^{]*\b${tag}\b[^{]*\{`),
      );
    }
  });
});

describe("an image", () => {
  const logo = (defaultHeroLayout as HeroLayout).blocks.find(
    (block) => block.id === "default-logo",
  ) as HeroImageBlock;
  const measured: HeroImageBlock = {
    ...logo,
    image: { ...logo.image, width: 320, height: 80 },
  };

  it("with dimensions is capped at its maximum height and keeps its own height inline", () => {
    // Tailwind's preflight sets `height: auto` on every image, which throws
    // away the `height` attribute the browser would size the box from before
    // the image arrives; restated inline, the box is reserved and `max-h`
    // caps it, the width following the aspect ratio.
    expect(imageClasses(measured)).toEqual([
      "w-auto max-w-full object-contain",
      "max-h-14",
      "dark:invert dark:hue-rotate-180",
    ]);
    expect(imageStyle(measured)).toEqual({ height: "80px" });
  });

  it("without dimensions reserves its height only", () => {
    expect(imageClasses(logo)).toEqual([
      "w-auto max-w-full object-contain",
      "h-14",
      "dark:invert dark:hue-rotate-180",
    ]);
    expect(imageStyle(logo)).toBeUndefined();
  });

  it("inverts in dark mode only when asked to", () => {
    const plain: HeroImageBlock = {
      ...measured,
      maxHeight: "xl",
      invertInDarkMode: false,
    };
    expect(imageClasses(plain)).toEqual([
      "w-auto max-w-full object-contain",
      "max-h-64",
    ]);
  });
});

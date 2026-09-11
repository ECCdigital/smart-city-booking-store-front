import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  blockBoxClasses,
  blockPanelStyle,
  HERO_ANCHOR_CLASSES,
  HERO_COLOR_CLASSES,
  HERO_COLUMN_ALIGN_CLASSES,
  HERO_DESKTOP_HEIGHT_CLASSES,
  HERO_HEIGHT_LENGTHS,
  HERO_IMAGE_HEIGHT_CLASSES,
  HERO_IMAGE_MAX_HEIGHT_CLASSES,
  HERO_INNER_SPACING_CLASSES,
  HERO_MOBILE_HEIGHT_CLASSES,
  HERO_OFFSET_X_CLASSES,
  HERO_OFFSET_Y_CLASSES,
  HERO_OUTER_SPACING_CLASSES,
  HERO_PANEL_RADIUS_CLASSES,
  HERO_ROW_JUSTIFY_CLASSES,
  HERO_TEXT_SIZE_CLASSES,
  HERO_WIDTH_CLASSES,
  blockColorStyle,
  imageBlockClasses,
  imageClasses,
  imageStyle,
  RICHTEXT_CLASS,
  RICHTEXT_COMPACT_CLASS,
  RICHTEXT_PANEL_CLASS,
  richtextBlockClasses,
  textBlockClasses,
} from "~/components/hero/heroClasses";
import {
  HERO_BLOCK_ALIGNMENTS,
  HERO_BLOCK_OFFSET_LIMIT,
  HERO_BLOCK_OFFSET_NONE,
  HERO_COLOR_TOKENS,
  HERO_HEIGHTS,
  HERO_IMAGE_MAX_HEIGHTS,
  HERO_SPACINGS,
  HERO_TEXT_SIZES,
  HERO_ZONES,
  HERO_BLOCK_WIDTHS,
  HERO_PANEL_GLASS,
  HERO_PANEL_RADII,
  type HeroBlock,
  type HeroBlockAlignment,
  type HeroImageBlock,
  type HeroLayout,
  type HeroPanel,
  type HeroPanelColor,
  type HeroPanelRadius,
  type HeroRichtextBlock,
  type HeroTextBlock,
} from "~~/shared/types/hero";

import { parseHeroLayout } from "~~/shared/utils/heroLayout";
import { HERO_RICHTEXT_CLASSES } from "~~/shared/utils/heroRichtextAllowlist";

import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import defaultHeroLayout from "./fixtures/hero-layout/default-hero-layout.json";

/** The stylesheet the Hero's rich text is painted by, read once. */
const STYLESHEET = readFileSync("app/assets/css/main.css", "utf8");

/**
 * What one rule of {@link STYLESHEET} applies, as the stylesheet spells it:
 * the utility classes of its `@apply`, or nothing when it has no such rule.
 *
 * The vocabulary of rendered rich text is painted by rules rather than by
 * classes on an element — no utility class reaches inside `v-html` — so this
 * is the only place the Hero's tables can be checked against what the page
 * will actually do with them.
 */
function appliedBy(selector: string): string | undefined {
  const escaped = selector.replaceAll(".", String.raw`\.`);
  const rule = new RegExp(String.raw`^${escaped} \{\n\s*@apply ([^;]+);`, "m");
  return rule.exec(STYLESHEET)?.[1];
}

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
      [HERO_PANEL_RADII, HERO_PANEL_RADIUS_CLASSES],
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

  it("offsets a Block by the thirteen rem steps of each axis, `x` from `md` up", () => {
    // −3 … 3 rem on the 0.5 grid, positive right and positive down. The `md:`
    // prefix on the `x` table is the whole of "below `md` only `y` applies":
    // both trees carry the same class and only one of them is showing.
    expect(HERO_OFFSET_X_CLASSES).toEqual({
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
    });
    expect(HERO_OFFSET_Y_CLASSES).toEqual({
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
    });

    // Every step of the contract's grid is in both tables, and the vertical
    // one is the only one a phone applies.
    for (let step = -HERO_BLOCK_OFFSET_LIMIT; step <= HERO_BLOCK_OFFSET_LIMIT; step += 0.5) {
      expect(HERO_OFFSET_X_CLASSES[step]).toBeDefined();
      expect(HERO_OFFSET_Y_CLASSES[step]).toBeDefined();
      expect(HERO_OFFSET_Y_CLASSES[step]).not.toContain("md:");
    }
  });

  it("anchors every Zone to its row and column of the content area", () => {
    expect(HERO_ANCHOR_CLASSES["top-left"]).toContain("top-0");
    expect(HERO_ANCHOR_CLASSES["bottom-right"]).toContain("bottom-0");
    expect(HERO_COLUMN_ALIGN_CLASSES).toEqual({
      left: "items-start text-left",
      center: "items-center text-center",
      right: "items-end text-right",
    });
  });

  it("centres the middle row without a transform, and spans the full content width", () => {
    // A transformed element is a stacking context, and a `front` Block inside
    // one could out-paint its own stack siblings but never a Block in another
    // Zone. So the middle row spans the content height and centres its stack
    // by free space, which overflows both ways exactly as the translate did.
    // Nothing in this table may grow a transform back.
    for (const zone of ["middle-left", "middle-center", "middle-right"] as const) {
      expect(HERO_ANCHOR_CLASSES[zone]).toContain("inset-y-0");
      expect(HERO_ANCHOR_CLASSES[zone]).toContain("justify-center");
    }

    for (const zone of HERO_ZONES) {
      expect(HERO_ANCHOR_CLASSES[zone]).toContain("inset-x-0");
      expect(HERO_ANCHOR_CLASSES[zone]).not.toMatch(/translate|rotate|scale/);
    }
  });

  it("stacks its Blocks as a column the anchors can centre, taking no pointer events", () => {
    // `justify-center` only centres what is laid out as a column, and an
    // anchor that took pointer events would shadow the Zone overlay beneath
    // it — both live in the component, which no test here renders.
    const component = readFileSync("app/components/hero/HeroZones.vue", "utf8");
    const anchor = component.match(/class="absolute[^"]*"/)?.[0] ?? "";

    expect(anchor).toContain("flex-col");
    expect(anchor).toContain("pointer-events-none");
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
  // The box is the one thing that reads the Panel, so this Block comes out of
  // the guard rather than off the raw fixture: the guard is what turns the
  // export's `panel` — object or legacy word — into the Panel or the `null`
  // the box asks about.
  const subtitle = parseHeroLayout(defaultHeroLayout)!.blocks.find(
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

  it("moves an offset Block with a translate on the Block itself", () => {
    // Never a margin, which would move the stack neighbours, and never on the
    // anchor, whose own placement it would overwrite.
    const moved: HeroBlock = { ...subtitle, offset: { x: -1.5, y: 2 } };

    expect(blockBoxClasses(moved)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-auto",
      "md:-translate-x-[1.5rem]",
      "translate-y-[2rem]",
    ]);
  });

  it("leaves a Block that is neither moved nor lifted exactly as it was", () => {
    // Both fields default to nothing at all, which is the overwhelmingly
    // common case: the class list has to be the one from before they existed.
    const still: HeroBlock = {
      ...subtitle,
      offset: { ...HERO_BLOCK_OFFSET_NONE },
      layer: "back",
    };

    expect(blockBoxClasses(still)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-auto",
    ]);
  });

  it("lifts a `front` Block above the Blocks it overlaps, wherever they are", () => {
    const front: HeroBlock = { ...subtitle, layer: "front", offset: { x: 0, y: 1 } };

    expect(blockBoxClasses(front)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-auto",
      "translate-y-[1rem]",
      "z-10",
    ]);
  });

  it("wears its Panel's radius and frosting only when it has a Panel", () => {
    const panelled: HeroBlock = {
      ...subtitle,
      outerSpacing: "md",
      innerSpacing: "sm",
      width: "md",
      panel: HERO_PANEL_GLASS,
    };
    expect(blockBoxClasses(panelled)).toEqual([
      "max-w-full min-w-0",
      "m-6",
      "p-4",
      "w-[32rem]",
      "rounded-xl",
      "backdrop-blur-lg",
    ]);
  });

  it("rounds its Panel to the step the author picked, `full` as a pill", () => {
    for (const [radius, expected] of Object.entries({
      none: "rounded-none",
      sm: "rounded-md",
      md: "rounded-xl",
      lg: "rounded-3xl",
      full: "rounded-full",
    })) {
      const panelled: HeroBlock = {
        ...subtitle,
        panel: { ...HERO_PANEL_GLASS, radius: radius as HeroPanelRadius },
      };
      expect(blockBoxClasses(panelled)).toContain(expected);
    }
  });

  it("frosts what lies behind its Panel, but not behind an opaque fill", () => {
    // A backdrop filter under a fill nothing can show through paints nothing
    // and costs a compositing layer, so full opacity drops it.
    const frosted: HeroBlock = { ...subtitle, panel: HERO_PANEL_GLASS };
    expect(blockBoxClasses(frosted)).toContain("backdrop-blur-lg");

    const opaque: HeroBlock = {
      ...subtitle,
      panel: { ...HERO_PANEL_GLASS, opacity: 100 },
    };
    expect(blockBoxClasses(opaque)).not.toContain("backdrop-blur-lg");

    const unfrosted: HeroBlock = {
      ...subtitle,
      panel: { ...HERO_PANEL_GLASS, blur: false },
    };
    expect(blockBoxClasses(unfrosted)).not.toContain("backdrop-blur-lg");
  });

  it("paints an empty Panel as pure frosting, or as nothing at all", () => {
    // `opacity: 0` is legitimate at both ends: with the blur it is frosting
    // without a tint, without it the Panel is invisible. Neither is an error,
    // so neither is special-cased away.
    const frosting: HeroBlock = {
      ...subtitle,
      panel: { ...HERO_PANEL_GLASS, opacity: 0 },
    };
    expect(blockBoxClasses(frosting)).toContain("backdrop-blur-lg");
    expect(blockPanelStyle(frosting)).toEqual({
      backgroundColor: "color-mix(in srgb, #ffffff 0%, transparent)",
    });

    const invisible: HeroBlock = {
      ...subtitle,
      panel: { ...HERO_PANEL_GLASS, opacity: 0, blur: false },
    };
    expect(blockBoxClasses(invisible)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-auto",
      "rounded-xl",
    ]);
  });

  it("mixes its Panel's fill inline, because no class carries a colour at a percentage", () => {
    expect(blockPanelStyle(subtitle)).toBeUndefined();

    const fills: [HeroPanelColor, string][] = [
      ["white", "#ffffff"],
      ["black", "#000000"],
      ["primary", "var(--ui-primary)"],
      ["secondary", "var(--ui-secondary)"],
      ["#b91c1c", "#b91c1c"],
    ];

    for (const [color, expected] of fills) {
      const panelled: HeroBlock = {
        ...subtitle,
        panel: { ...HERO_PANEL_GLASS, color, opacity: 40 },
      };
      expect(blockPanelStyle(panelled)).toEqual({
        backgroundColor: `color-mix(in srgb, ${expected} 40%, transparent)`,
      });
      // The fill is the whole of what goes inline; the classes stay literal.
      expect(
        blockBoxClasses(panelled).some((entry) => entry.includes(expected)),
      ).toBe(false);
    }
  });

  it("keeps an opaque Panel opaque and its alpha off the Block's content", () => {
    // The percentage is the alpha of the fill alone — never the `opacity`
    // property, which would fade the text and the image on top of it too.
    const opaque: HeroBlock = {
      ...subtitle,
      panel: { ...HERO_PANEL_GLASS, color: "black", opacity: 100 },
    };
    expect(blockPanelStyle(opaque)).toEqual({
      backgroundColor: "color-mix(in srgb, #000000 100%, transparent)",
    });
  });

  it("hands its fill to the element the Block renders, or the Panel is invisible", () => {
    // There is no component test in this repo, and a fill that never reaches
    // an element is a Panel nobody can see, so the wiring is asserted at the
    // source — as the preview bridge's sanitiser is. The Block's box binds it
    // the way the copy binds its hex colour: spread rather than `:style`, so
    // the server renderer writes no empty `style=""` for a Block without one.
    const component = readFileSync("app/components/hero/HeroBlock.vue", "utf8");

    expect(component).toMatch(/blockPanelStyle\(/);
    expect(component).toMatch(/v-bind="panelStyle"/);
  });

  it("paints its Panel and places its Offset the same in the Compact Hero", () => {
    // The box takes no mode, and this is what keeps it that way. There is
    // nothing for the Compact Hero to step a Panel down by, and an Offset it
    // must not step down: it is a placement the author chose in rem, and
    // halving it silently would make the compact frame disagree with the form.
    expect(blockBoxClasses).toHaveLength(1);

    const moved: HeroBlock = { ...subtitle, offset: { x: 3, y: -3 } };
    expect(blockBoxClasses(moved)).toContain("md:translate-x-[3rem]");
    expect(blockBoxClasses(moved)).toContain("-translate-y-[3rem]");
  });

  it("takes its padding from `innerSpacing` alone, whatever the Panel says", () => {
    const padded: HeroBlock = { ...subtitle, innerSpacing: "lg" };
    const panels: (HeroPanel | null)[] = [
      null,
      HERO_PANEL_GLASS,
      { ...HERO_PANEL_GLASS, radius: "full", opacity: 0, blur: false },
    ];

    for (const panel of panels) {
      expect(blockBoxClasses({ ...padded, panel })).toContain("p-8");
    }
  });
});

describe("a text Block", () => {
  // Parsed rather than read off the fixture, like the box above: a copy Block
  // reads its own Panel now, and the export's `panel` is what the guard turns
  // into one.
  const subtitle = parseHeroLayout(defaultHeroLayout)!.blocks.find(
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

  it("drops `default` to black in both modes on a Panel, which does not flip", () => {
    expect(textBlockClasses(subtitle, "home")).toContain(
      "text-black dark:text-white",
    );

    const onPanel: HeroTextBlock = { ...subtitle, panel: HERO_PANEL_GLASS };
    expect(textBlockClasses(onPanel, "home")).toContain("text-black");
    expect(textBlockClasses(onPanel, "home")).not.toContain(
      "text-black dark:text-white",
    );

    // The Compact Hero steps the text size down and nothing else: a Panel is
    // painted the same in both Heroes, so the colour it forces is too.
    expect(textBlockClasses(onPanel, "compact")).toContain("text-black");

    // Only `default` follows the mode, so only `default` has anything to give
    // up; every other named colour is painted the same on a Panel and off it.
    const white: HeroTextBlock = { ...onPanel, color: "white" };
    expect(textBlockClasses(white, "home")).toContain("text-white");
  });
});

describe("a rich-text Block", () => {
  const openingHours = parseHeroLayout(crowdedHeroLayout)!.blocks.find(
    (block) => block.type === "richtext",
  ) as HeroRichtextBlock;

  it("wears the stylesheet hooks, its step for the mode, its colour and shadow", () => {
    // The fixture Block stores no `size`, so the guard's `md` is its step,
    // and its `"translucent"` normalised into a Panel — hence the hook.
    expect(richtextBlockClasses(openingHours, "home")).toEqual([
      RICHTEXT_CLASS,
      HERO_TEXT_SIZE_CLASSES.home.md,
      "text-white",
      "[text-shadow:0_1px_3px_rgba(0,0,0,0.6)]",
      RICHTEXT_PANEL_CLASS,
    ]);
    expect(blockColorStyle(openingHours)).toBeUndefined();
  });

  it("renders one step down in the Compact Hero, like every text", () => {
    expect(richtextBlockClasses(openingHours, "compact")).toContain(
      HERO_TEXT_SIZE_CLASSES.compact.md,
    );
  });

  it("renders at its own step of the scale, at every step and in both Heroes", () => {
    for (const size of HERO_TEXT_SIZES) {
      const stepped: HeroRichtextBlock = { ...openingHours, size };
      expect(richtextBlockClasses(stepped, "home")).toContain(
        HERO_TEXT_SIZE_CLASSES.home[size],
      );
      expect(richtextBlockClasses(stepped, "compact")).toContain(
        HERO_TEXT_SIZE_CLASSES.compact[size],
      );
    }
  });

  it("marks the Compact Hero on its root, which the stylesheet cannot see", () => {
    // The mode is a component prop, and a `hero-size-*` run inside `v-html`
    // has to step down with it: the hook is how the rule reaches the mode.
    expect(richtextBlockClasses(openingHours, "compact")).toContain(
      RICHTEXT_COMPACT_CLASS,
    );
    expect(richtextBlockClasses(openingHours, "home")).not.toContain(
      RICHTEXT_COMPACT_CLASS,
    );
  });

  it("marks its Panel on its root, so a `default` run goes black on it too", () => {
    // `copyClasses` decides this for the Block's own copy by reading its
    // Panel; a `hero-color-default` run inside `v-html` is out of its reach,
    // and the hook is what carries the same fact to the stylesheet.
    const onPanel: HeroRichtextBlock = { ...openingHours, panel: HERO_PANEL_GLASS };
    expect(richtextBlockClasses(onPanel, "home")).toContain(RICHTEXT_PANEL_CLASS);

    const bare: HeroRichtextBlock = { ...openingHours, panel: null };
    expect(richtextBlockClasses(bare, "home")).not.toContain(RICHTEXT_PANEL_CLASS);
  });

  it("renders a hex colour inline and no shadow unless asked", () => {
    const plain: HeroRichtextBlock = {
      ...openingHours,
      color: "#1d4ed8",
      shadow: false,
    };

    const classes = richtextBlockClasses(plain, "home");
    expect(classes).toEqual([
      RICHTEXT_CLASS,
      HERO_TEXT_SIZE_CLASSES.home.md,
      RICHTEXT_PANEL_CLASS,
    ]);
    expect(blockColorStyle(plain)).toEqual({ color: "#1d4ed8" });
  });

  it("drops `default` to black on a Panel, like the copy of a text Block", () => {
    const plain: HeroRichtextBlock = {
      ...openingHours,
      color: "default",
      panel: null,
    };
    expect(richtextBlockClasses(plain, "home")).toContain(
      "text-black dark:text-white",
    );

    const onPanel: HeroRichtextBlock = {
      ...plain,
      panel: HERO_PANEL_GLASS,
    };
    expect(richtextBlockClasses(onPanel, "home")).toContain("text-black");
    expect(richtextBlockClasses(onPanel, "home")).not.toContain(
      "text-black dark:text-white",
    );
  });

  it("paints the six size steps of the vocabulary at the values a text Block uses", () => {
    // The one rule of this ticket that cannot be a class: the run is inside
    // `v-html`. `@apply` keeps the Tailwind classes of the table the single
    // source of truth, and this test is what pins the two together — the
    // stylesheet, the class vocabulary the sanitiser lets through and the
    // size table have to name the same six steps and the same values.
    for (const size of HERO_TEXT_SIZES) {
      const mark = `hero-size-${size}`;
      expect(HERO_RICHTEXT_CLASSES.size).toContain(mark);

      expect(appliedBy(`.${RICHTEXT_CLASS} span.${mark}`)).toBe(
        HERO_TEXT_SIZE_CLASSES.home[size],
      );
      expect(
        appliedBy(`.${RICHTEXT_CLASS}.${RICHTEXT_COMPACT_CLASS} span.${mark}`),
      ).toBe(HERO_TEXT_SIZE_CLASSES.compact[size]);
    }
  });

  it("paints the four colour tokens of the vocabulary, `default` black on a Panel", () => {
    for (const token of HERO_COLOR_TOKENS) {
      const mark = `hero-color-${token}`;
      expect(HERO_RICHTEXT_CLASSES.color).toContain(mark);
      expect(appliedBy(`.${RICHTEXT_CLASS} span.${mark}`)).toBe(
        HERO_COLOR_CLASSES[token],
      );
    }

    // A Panel does not flip with the colour mode, so the copy on it cannot
    // either — the same black `copyClasses` gives the Block's own `default`.
    const onPanel: HeroRichtextBlock = {
      ...openingHours,
      color: "default",
      panel: HERO_PANEL_GLASS,
    };
    expect(
      appliedBy(`.${RICHTEXT_CLASS}.${RICHTEXT_PANEL_CLASS} span.hero-color-default`),
    ).toBe("text-black");
    expect(richtextBlockClasses(onPanel, "home")).toContain("text-black");

    // `data-color` is already a `style` on its own span, which beats every
    // rule in the stylesheet; a rule that selected the attribute could only
    // fight it, so there is none.
    expect(STYLESHEET).not.toMatch(/\[data-color/);
  });

  it("lets a paragraph's own alignment override the Block's", () => {
    for (const align of ["left", "center", "right"] as const) {
      // The Block declares its `align` on its box, so the paragraph inherits
      // it; the paragraph rule has to name the very same alignment to be an
      // override of it rather than a second opinion about it.
      const [blockAlign] = blockBoxClasses({
        ...openingHours,
        align,
      }).filter((entry) => entry.startsWith("text-"));

      expect(HERO_RICHTEXT_CLASSES.align).toContain(`hero-align-${align}`);
      expect(appliedBy(`.${RICHTEXT_CLASS} p.hero-align-${align}`)).toBe(
        blockAlign,
      );
    }
  });

  it("puts the typography of the allowed tags in one stylesheet rule, not in classes", () => {
    // The markup arrives through `v-html`, so no utility class can reach the
    // tags inside it; `.hero-richtext` in main.css styles them instead. The
    // preflight would otherwise strip the list markers and the link underline.
    for (const tag of ["p", "ul", "ol", "li", "a"]) {
      expect(STYLESHEET).toMatch(
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

describe("a Block's alignment", () => {
  const subtitle = parseHeroLayout(defaultHeroLayout)!.blocks.find(
    (block) => block.id === "default-subtitle",
  ) as HeroBlock;
  const crest = parseHeroLayout(defaultHeroLayout)!.blocks.find(
    (block) => block.id === "default-logo",
  ) as HeroImageBlock;

  it("aligns the lines of a text or rich-text Block inside its own box", () => {
    const aligned: [HeroBlockAlignment, string][] = [
      ["left", "text-left"],
      ["center", "text-center"],
      ["right", "text-right"],
    ];

    for (const [align, expected] of aligned) {
      expect(blockBoxClasses({ ...subtitle, align, width: "sm" })).toEqual([
        "max-w-full min-w-0",
        "m-0",
        "p-0",
        "w-80",
        expected,
      ]);
    }
  });

  it("leaves an `auto` Block to the Zone it sits in, in all nine of them", () => {
    // The strictest thing this field has to do: a Block nobody aligned comes
    // out exactly as it did before the field existed, at every width and in
    // every Zone. `auto` therefore emits nothing at all and inherits what the
    // anchor — or, on mobile, the row group — already declares.
    for (const zone of HERO_ZONES) {
      for (const width of HERO_BLOCK_WIDTHS) {
        const untouched: HeroBlock = { ...subtitle, zone, width, align: "auto" };

        expect(blockBoxClasses(untouched)).toEqual([
          "max-w-full min-w-0",
          "m-0",
          "p-0",
          HERO_WIDTH_CLASSES[width],
        ]);
        expect(imageBlockClasses({ ...crest, zone, width, align: "auto" })).toEqual(
          [],
        );
      }
    }
  });

  it("is what the anchor and the mobile row group leave an `auto` Block to inherit", () => {
    // `auto` is only "the Zone column, and centre on mobile" for as long as
    // these two declare it, and neither is asserted anywhere else: the column
    // table places the boxes with `items-*` and aligns their lines with
    // `text-*`, and the mobile row does both for a tree that has no columns.
    for (const column of ["left", "center", "right"] as const) {
      expect(HERO_COLUMN_ALIGN_CLASSES[column]).toContain(`text-${column}`);
    }

    const mobile = readFileSync("app/components/hero/HeroMobileStack.vue", "utf8");
    const row = mobile.match(/class="flex min-h-0[^"]*"/)?.[0] ?? "";

    expect(row).toContain("items-center");
    expect(row).toContain("text-center");
  });

  it("centres an image inside its box, where no `text-align` reaches it", () => {
    // The acceptance fixture's coat of arms: 20 rem of box and an image that
    // shrinks to its own width. The preflight makes an image a block-level
    // element, which ignores the `text-align` its lines-of-copy siblings
    // follow, so it is placed by its margins instead.
    expect(imageBlockClasses({ ...crest, width: "sm", align: "center" })).toEqual([
      "mx-auto",
    ]);
  });

  it("hands that alignment to the image element, or it aligns nothing", () => {
    // There is no component test in this repo, so the wiring is asserted at
    // the source, as the Panel's fill is: the class falls through the one
    // image element onto the `img` it renders.
    const component = readFileSync("app/components/hero/HeroBlock.vue", "utf8");

    expect(component).toMatch(/:class="imageBlockClasses\(image\)"/);
  });

  it("is emitted at `width: \"auto\"` too, where there is nothing to align in", () => {
    // A box that shrinks to fit has nothing to spare, so the field is
    // invisible there — a consequence of the width and not a rule of its own,
    // which is why nothing is special-cased for it and the same class comes
    // out. The exception proves the rule: a Block whose lines wrap against
    // `max-w-full` has a box wider than its lines after all, and then the
    // alignment shows at `auto` as well.
    expect(blockBoxClasses({ ...subtitle, align: "center", width: "auto" })).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-auto",
      "text-center",
    ]);
    expect(imageBlockClasses({ ...crest, align: "center", width: "auto" })).toEqual([
      "mx-auto",
    ]);
  });

  it("is absolute on a phone as well, and the same in the Compact Hero", () => {
    // Nothing here is stepped or prefixed: an author who picks an alignment
    // gets it in both trees — only the Block's box stays centred on mobile,
    // which is the row group's doing — and in both Hero modes, which is why
    // neither function takes one.
    for (const align of HERO_BLOCK_ALIGNMENTS) {
      const aligned: HeroBlock = { ...subtitle, align, width: "sm" };
      const image: HeroImageBlock = { ...crest, align, width: "sm" };

      for (const entry of [...blockBoxClasses(aligned), ...imageBlockClasses(image)]) {
        expect(entry).not.toContain("md:");
      }
    }

    expect(imageBlockClasses).toHaveLength(1);
  });
});

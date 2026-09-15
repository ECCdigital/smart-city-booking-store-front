import { describe, expect, it } from "vitest";

import {
  blockBoxClasses,
  blockPanelStyle,
  imageBlockClasses,
  imageClasses,
  richtextBlockClasses,
  textBlockClasses,
} from "~/components/hero/heroClasses";
import { visibleBlocks } from "~/utils/heroBlocks";
import {
  intendsOverlap,
  measureHeroPreview,
  type HeroPreviewBox,
  type HeroPreviewMeasuredBlock,
} from "~/utils/heroPreview";
import { parseHeroLayout } from "~~/shared/utils/heroLayout";
import type {
  HeroBlock,
  HeroImageBlock,
  HeroLayout,
  HeroRichtextBlock,
  HeroTextBlock,
} from "~~/shared/types/hero";

import acceptanceHeroLayout from "./fixtures/hero-layout/acceptance-hero-layout.json";
import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import defaultHeroLayout from "./fixtures/hero-layout/default-hero-layout.json";

/**
 * The Block-styling amendment's acceptance walk: the Bad Belzig Hero of the
 * Shared contract, rendered the way the screenshot at
 * `smart-city-booking-vue-app/.scratch/hero-block-styling/fixtures/bad-belzig-hero.png`
 * shows it, and the two things that walk must not disturb — the overlap
 * warning the crowded layout is the fixture for, and the Offset the Compact
 * Hero applies as authored.
 *
 * What is pinned here is the markup alone: the classes and inline styles the
 * renderer emits. What that markup measures out to is not pinned, because
 * these tests have no layout engine to ask — the crest centred at 10 rem of a
 * 20 rem Panel, its lower edge half a rem over the Panel's upper one, the
 * frosting dropped at full opacity — and neither are the two colour modes and
 * the two viewports, which are `dark:` variants and `md:` prefixes here and
 * nothing more. All of it was measured by hand instead, in a browser against
 * this repo's compiled stylesheet; the numbers are in the ticket file.
 */

const acceptance = parseHeroLayout(acceptanceHeroLayout)!;
const crest = acceptance.blocks[0] as HeroImageBlock;
const claim = acceptance.blocks[1] as HeroRichtextBlock;

/** The Hero's content area, as the bridge measures it: 1200 × 240 at 20/40. */
const CONTENT_AREA = { left: 20, top: 40, right: 1220, bottom: 280 };

/** One measured Block, carrying the flag the bridge derives from the layout. */
function measure(block: HeroBlock, box: HeroPreviewBox): HeroPreviewMeasuredBlock {
  return { id: block.id, zone: block.zone, box, overlapIntended: intendsOverlap(block) };
}

/**
 * The crest and the claim as the bridge would report them, the crest's box
 * lying over the Panel's upper edge — the intersection any warning would have
 * to come from.
 */
function measuredAcceptanceBlocks(): HeroPreviewMeasuredBlock[] {
  return [
    measure(crest, { left: 40, top: 96, right: 360, bottom: 160 }),
    measure(claim, { left: 40, top: 152, right: 360, bottom: 260 }),
  ];
}

describe("the acceptance fixture, as the screenshot shows it", () => {
  it("puts the claim on a white opaque Panel with medium corners", () => {
    // Opaque, so the „Glas“ default `blur: true` the author never touched
    // paints nothing and the backdrop filter is left off: it would cost a
    // compositing layer behind a fill nothing can show through.
    expect(blockBoxClasses(claim)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-6",
      "w-80",
      "rounded-xl",
    ]);
    expect(blockPanelStyle(claim)).toEqual({
      backgroundColor: "color-mix(in srgb, #ffffff 100%, transparent)",
    });
  });

  it("centres the crest in its own 20 rem Block", () => {
    // Both Blocks are `width: "sm"`, so the Panel is 20 rem wide and the
    // crest has a 20 rem box to be placed in; `align: "center"` puts its
    // centre on the Panel's own centre. The screenshot measures 9.98 rem of
    // 20. A block-level image ignores `text-align`, so the margins place it.
    expect(blockBoxClasses(crest)).toContain("w-80");
    expect(imageBlockClasses(crest)).toEqual(["mx-auto"]);
  });

  it("moves it half a rem down onto the Panel's upper edge, in front of it", () => {
    // The crest Block comes first, so without the Offset its lower edge is
    // exactly the Panel's upper one; one step of `y` pushes it that half rem
    // down over the edge — the screenshot's 0.48 rem. `layer: "front"` is
    // what paints it over the Panel; without it the fill would cover it.
    //
    // The box carries the `text-center` of the same `align`, which a
    // block-level image ignores — the whole reason the image needs margins of
    // its own — but which is emitted all the same, the box not knowing what
    // it holds.
    expect(blockBoxClasses(crest)).toEqual([
      "max-w-full min-w-0",
      "m-0",
      "p-0",
      "w-80",
      "text-center",
      "translate-y-[0.5rem]",
      "z-10",
    ]);
  });

  it("caps the crest at the 3.5 rem of its height step", () => {
    // The screenshot measures 3.68 rem. The reference is unenriched here, as
    // the contract stores it, so the step is a fixed height rather than a cap
    // — the export enriches it and the cap applies then.
    expect(imageClasses(crest)).toEqual([
      "w-auto max-w-full object-contain",
      "h-14",
    ]);
  });

  it("paints the claim's two lines from their own classes over an `md` Block", () => {
    // The Block is `md` and `default`; the runs carry `2xl`/`primary` and
    // `md`/`default` as classes, which the stylesheet rules under
    // `.hero-richtext` paint. `hero-on-panel` is how those rules learn that
    // `default` has to be black in both modes here.
    expect(richtextBlockClasses(claim, "home")).toEqual([
      "hero-richtext",
      "text-base md:text-lg",
      "text-black",
      "hero-on-panel",
    ]);
    expect(claim.html.de).toContain('class="hero-size-2xl hero-color-primary"');
    expect(claim.html.de).toContain('class="hero-size-md hero-color-default"');
  });

  it("raises no overlap warning, the two Blocks sharing a Zone", () => {
    // What actually reaches this pair first is the older rule: both Blocks are
    // `middle-left`, and a Zone's own stack is never reported. Worth asserting
    // as the fixture's own outcome, and worth saying plainly that the
    // amendment's suppression is not what produces it — the test below is.
    expect(crest.zone).toBe(claim.zone);
    expect(
      measureHeroPreview(CONTENT_AREA, measuredAcceptanceBlocks(), "desktop"),
    ).toEqual([]);
  });

  it("marks the crest's overlap deliberate wherever it lands", () => {
    // The crest is offset and in front, which is what the bridge reads per
    // Block. Put it in a Zone of its own so the same-Zone rule no longer
    // covers the pair, and the suppression is the only thing left that can
    // keep the warning away — asserted against the same pair without it.
    expect(intendsOverlap(crest)).toBe(true);
    expect(intendsOverlap(claim)).toBe(false);

    const [moved, panel] = measuredAcceptanceBlocks();
    const elsewhere = { ...moved!, zone: "middle-center" as const };

    expect(measureHeroPreview(CONTENT_AREA, [elsewhere, panel!], "desktop")).toEqual(
      [],
    );
    expect(
      measureHeroPreview(
        CONTENT_AREA,
        [{ ...elsewhere, overlapIntended: false }, panel!],
        "desktop",
      ),
    ).toEqual([{ code: "overlap", blockIds: ["belzig-crest", "belzig-claim"] }]);
  });
});

describe("the crowded layout", () => {
  const crowded = parseHeroLayout(crowdedHeroLayout)!;

  it("keeps its Blocks at the Offset and Layer the suppression reads", () => {
    // The fixture the overlap warning is tested with: were any of its Blocks
    // moved or lifted, the pair below would be read as a deliberate overlap
    // and would silently leave the Preview Report.
    for (const block of crowded.blocks) {
      expect(intendsOverlap(block)).toBe(false);
    }
  });

  it("still produces the overlap warning it is there for", () => {
    const overlapping: HeroPreviewMeasuredBlock[] = [
      measure(crowded.blocks[1]!, { left: 40, top: 40, right: 620, bottom: 180 }),
      measure(crowded.blocks[2]!, { left: 400, top: 40, right: 700, bottom: 140 }),
    ];

    expect(measureHeroPreview(CONTENT_AREA, overlapping, "desktop")).toEqual([
      { code: "overlap", blockIds: ["headline", "unmeasured-logo"] },
    ]);
  });
});

describe("the Compact Hero", () => {
  const layouts: [string, HeroLayout][] = [
    ["the Default Hero Layout", parseHeroLayout(defaultHeroLayout)!],
    ["the crowded layout", parseHeroLayout(crowdedHeroLayout)!],
    ["the acceptance fixture", acceptance],
  ];

  for (const [name, layout] of layouts) {
    it(`renders ${name} with every Offset at the rem its author chose`, () => {
      // That the box cannot step an Offset down at all is settled by its
      // arity in `heroClasses.test.ts`; what is walked here is the three
      // fixtures' own Blocks, in the set the Compact Hero renders. The rem
      // each class has to name is read off the fixture's number rather than
      // off the class table, so the two can disagree. A Block nobody moved
      // keeps emitting nothing at all.
      const blocks = visibleBlocks(layout, "compact");
      expect(blocks.length).toBeGreaterThan(0);

      for (const block of blocks) {
        const classes = blockBoxClasses(block);

        for (const axis of ["x", "y"] as const) {
          const step = block.offset[axis];
          const emitted = classes.find((className) =>
            className.includes(`translate-${axis}-`),
          );

          if (step === 0) {
            expect(emitted).toBeUndefined();
            continue;
          }
          expect(emitted).toContain(`[${Math.abs(step)}rem]`);
          expect(emitted?.includes("-translate")).toBe(step < 0);
        }
      }
    });
  }

  it("steps the copy down while leaving the Offset where it was", () => {
    // The other half of the same statement: sizes do step down in the
    // Compact Hero, so "as authored" is a choice the Offset makes and not
    // something no part of the Hero does.
    const subtitle = parseHeroLayout(defaultHeroLayout)!.blocks.find(
      (block) => block.id === "default-subtitle",
    ) as HeroTextBlock;

    expect(textBlockClasses(subtitle, "home")).toContain("text-2xl md:text-5xl");
    expect(textBlockClasses(subtitle, "compact")).toContain("text-xl md:text-3xl");
  });
});

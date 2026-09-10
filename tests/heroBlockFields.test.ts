import { describe, expect, it } from "vitest";

import { buildHeroPreviewSnapshot } from "~/utils/heroPreview";
import {
  isHeroPanelColorToken,
  parseHeroLayout,
} from "~~/shared/utils/heroLayout";
import { HERO_PANEL_GLASS } from "~~/shared/types/hero";

/**
 * The fields the Panel amendment adds to every Block — `align`, `panel`,
 * `offset`, `layer` — and the `size` it adds to rich text.
 *
 * They are read leniently, unlike the fields that were in schema v1 from the
 * start: a value off the contract falls back to its default instead of failing
 * the layout. The Fallback Hero Layout is for a bundle that cannot be read at
 * all, not for one odd value, and these five arrive from a backend that is
 * still rolling its half out. The strict fields keep failing with the codes
 * `tests/heroLayoutGuards.test.ts` pins.
 */

/** The one Block every case here varies; `panel` and friends stay unset. */
function blockWith(fields: Record<string, unknown>) {
  return {
    version: 1,
    blocks: [
      { id: "a", type: "text", zone: "top-left", text: { de: "Eins" }, ...fields },
    ],
  };
}

/** The parsed first Block, as a bag of fields the assertions can read. */
function firstBlock(input: unknown): Record<string, unknown> {
  const layout = parseHeroLayout(input);
  expect(layout).not.toBeNull();
  return layout!.blocks[0] as unknown as Record<string, unknown>;
}

describe("the Panel", () => {
  it("normalises an empty object to the Glas preset", () => {
    expect(firstBlock(blockWith({ panel: {} })).panel).toEqual({
      color: "white",
      opacity: 60,
      radius: "md",
      blur: true,
    });
  });

  it("exports the Glas preset as the defaults of its own keys", () => {
    expect(HERO_PANEL_GLASS).toEqual({
      color: "white",
      opacity: 60,
      radius: "md",
      blur: true,
    });
  });

  it("keeps a fully specified Panel", () => {
    const panel = { color: "#112233", opacity: 0, radius: "full", blur: false };

    expect(firstBlock(blockWith({ panel })).panel).toEqual(panel);
  });

  it("accepts the Panel's own colour tokens, `black` among them", () => {
    for (const color of ["white", "black", "primary", "secondary"]) {
      expect(firstBlock(blockWith({ panel: { color } })).panel).toMatchObject({
        color,
      });
    }
  });

  it("reads no Panel as `null`, whether absent or explicit", () => {
    expect(firstBlock(blockWith({})).panel).toBeNull();
    expect(firstBlock(blockWith({ panel: null })).panel).toBeNull();
  });

  it("reads the legacy words a backend that has not shipped its half sends", () => {
    // Losing every Panel of a layout mid-rollout is worse than reading both
    // forms, so `"none"` and `"translucent"` stay accepted.
    expect(firstBlock(blockWith({ panel: "none" })).panel).toBeNull();
    expect(firstBlock(blockWith({ panel: "translucent" })).panel).toEqual(
      HERO_PANEL_GLASS,
    );
  });

  it("hands out a Panel of its own rather than the shared preset", () => {
    const layout = parseHeroLayout({
      version: 1,
      blocks: [
        { id: "a", type: "text", zone: "top-left", text: { de: "Eins" }, panel: "translucent" },
      ],
    });

    expect(layout?.blocks[0]?.panel).not.toBe(HERO_PANEL_GLASS);
  });

  it("falls a Panel that is neither null, object nor legacy word back to none", () => {
    expect(firstBlock(blockWith({ panel: "glass" })).panel).toBeNull();
    expect(firstBlock(blockWith({ panel: 42 })).panel).toBeNull();
    expect(firstBlock(blockWith({ panel: ["translucent"] })).panel).toBeNull();
  });

  it("falls each off-contract key back to its Glas default", () => {
    expect(
      firstBlock(
        blockWith({
          panel: { color: "chartreuse", opacity: 140, radius: "xl", blur: "yes" },
        }),
      ).panel,
    ).toEqual(HERO_PANEL_GLASS);
  });

  it("keeps six hex digits and refuses the shorthand", () => {
    // The contract's colour is `/^#[0-9a-f]{6}$/i` — no alpha, no shorthand —
    // and a Panel's colour is the same string as a text Block's.
    expect(firstBlock(blockWith({ panel: { color: "#AABBCC" } })).panel).toMatchObject({
      color: "#AABBCC",
    });
    expect(firstBlock(blockWith({ panel: { color: "#abc" } })).panel).toMatchObject({
      color: "white",
    });
    expect(
      firstBlock(blockWith({ panel: { color: "#aabbccdd" } })).panel,
    ).toMatchObject({ color: "white" });
  });

  it("tells the Panel's named colours from a hex value", () => {
    // What the renderer needs to know: a token becomes a theme colour, a hex
    // value is painted as given. `default` belongs to text, not to a Panel.
    expect(isHeroPanelColorToken("black")).toBe(true);
    expect(isHeroPanelColorToken("white")).toBe(true);
    expect(isHeroPanelColorToken("primary")).toBe(true);
    expect(isHeroPanelColorToken("secondary")).toBe(true);
    expect(isHeroPanelColorToken("default")).toBe(false);
    expect(isHeroPanelColorToken("#112233")).toBe(false);
  });

  it("rejects a fractional opacity but keeps the whole percentages", () => {
    expect(firstBlock(blockWith({ panel: { opacity: 12.5 } })).panel).toMatchObject({
      opacity: 60,
    });
    expect(firstBlock(blockWith({ panel: { opacity: 100 } })).panel).toMatchObject({
      opacity: 100,
    });
    expect(firstBlock(blockWith({ panel: { opacity: 0 } })).panel).toMatchObject({
      opacity: 0,
    });
  });
});

describe("align, offset and layer", () => {
  it("carries them on all three Block types, not on text alone", () => {
    // `align` is common because the acceptance fixture centres an image Block
    // over a Panel that a rich-text Block paints.
    const layout = parseHeroLayout({
      version: 1,
      blocks: [
        { id: "t", type: "text", zone: "top-left", text: { de: "Eins" }, align: "right" },
        { id: "r", type: "richtext", zone: "top-left", html: { de: "<p>Zwei</p>" }, align: "center" },
        {
          id: "i",
          type: "image",
          zone: "top-left",
          image: { source: "media", mediaId: "66f1c2000000000000000001" },
          alt: { de: "Drei" },
          align: "left",
        },
      ],
    });

    expect(layout?.blocks.map((block) => block.align)).toEqual([
      "right",
      "center",
      "left",
    ]);
  });

  it("defaults align to auto and layer to back", () => {
    const block = firstBlock(blockWith({}));

    expect(block.align).toBe("auto");
    expect(block.layer).toBe("back");
  });

  it("keeps a front Block in front", () => {
    expect(firstBlock(blockWith({ layer: "front" })).layer).toBe("front");
  });

  it("falls an unknown align or layer back to its default", () => {
    expect(firstBlock(blockWith({ align: "justify" })).align).toBe("auto");
    expect(firstBlock(blockWith({ align: 3 })).align).toBe("auto");
    expect(firstBlock(blockWith({ layer: "middle" })).layer).toBe("back");
    expect(firstBlock(blockWith({ layer: true })).layer).toBe("back");
  });

  it("defaults the offset to no displacement at all", () => {
    expect(firstBlock(blockWith({})).offset).toEqual({ x: 0, y: 0 });
  });

  it("keeps every step of the 0.5 grid, both signs", () => {
    for (const step of [-3, -2.5, -0.5, 0, 0.5, 2.5, 3]) {
      expect(firstBlock(blockWith({ offset: { x: step, y: -step } })).offset).toEqual({
        x: step,
        y: -step,
      });
    }
  });

  it("falls an out-of-range or off-grid axis back to zero", () => {
    // The contract's check is exact: 0.5 has no rounding error in binary
    // floating point, so `Number.isInteger(v * 2)` needs no epsilon.
    expect(firstBlock(blockWith({ offset: { x: 3.5, y: 0.25 } })).offset).toEqual({
      x: 0,
      y: 0,
    });
    expect(firstBlock(blockWith({ offset: { x: -4, y: Number.NaN } })).offset).toEqual({
      x: 0,
      y: 0,
    });
    expect(
      firstBlock(blockWith({ offset: { x: Number.POSITIVE_INFINITY, y: "1" } })).offset,
    ).toEqual({ x: 0, y: 0 });
  });

  it("falls only the failing axis back, so the other survives", () => {
    expect(firstBlock(blockWith({ offset: { x: 1.5, y: 99 } })).offset).toEqual({
      x: 1.5,
      y: 0,
    });
  });

  it("falls an offset that is not a pair of numbers back to zero", () => {
    expect(firstBlock(blockWith({ offset: "1rem" })).offset).toEqual({ x: 0, y: 0 });
    expect(firstBlock(blockWith({ offset: [1, 2] })).offset).toEqual({ x: 0, y: 0 });
    expect(firstBlock(blockWith({ offset: null })).offset).toEqual({ x: 0, y: 0 });
  });
});

describe("the size of a rich-text Block", () => {
  function richtextBlock(fields: Record<string, unknown>) {
    return {
      version: 1,
      blocks: [
        { id: "a", type: "richtext", zone: "top-left", html: { de: "<p>Eins</p>" }, ...fields },
      ],
    };
  }

  it("defaults to md, the step a run without a class of its own inherits", () => {
    expect(firstBlock(richtextBlock({})).size).toBe("md");
  });

  it("takes any step of the text scale", () => {
    for (const size of ["xs", "sm", "md", "lg", "xl", "2xl"]) {
      expect(firstBlock(richtextBlock({ size })).size).toBe(size);
    }
  });

  it("falls an unknown step back to md instead of failing the layout", () => {
    expect(firstBlock(richtextBlock({ size: "huge" })).size).toBe("md");
    expect(firstBlock(richtextBlock({ size: 2 })).size).toBe("md");
  });

  it("leaves the strictness of a text Block's own size alone", () => {
    // `size` on a text Block is schema v1 and stays strict: the amendment's
    // leniency is for the fields it adds, not a relaxation of the contract.
    const issues: unknown[] = [];

    expect(
      parseHeroLayout(blockWith({ size: "huge" }), {
        onIssue: (issue) => issues.push(issue),
      }),
    ).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].size", code: "invalid_enum" },
    ]);
  });
});

describe("the Draft path of the Live Preview", () => {
  /**
   * The preview builder runs `parseHeroLayout` on the Draft, so it reads the
   * amendment's fields through the very same guard the Theme Bundle route
   * uses. That is what keeps the preview and the delivered page from
   * disagreeing about a Panel, and it is pinned here rather than left to the
   * builder's own tests, which are about the bridge and not about the fields.
   */
  it("reads the same fields through the same guard as the delivered page", () => {
    const block = {
      id: "belzig-crest",
      type: "image",
      zone: "middle-left",
      width: "sm",
      align: "center",
      panel: { color: "white", opacity: 100 },
      offset: { x: 0, y: 0.5 },
      layer: "front",
      image: { source: "media", mediaId: "66f1c2000000000000000004" },
      alt: { de: "Wappen der Stadt Bad Belzig" },
      maxHeight: "sm",
    };
    const heroLayout = { version: 1, blocks: [block] };

    const snapshot = buildHeroPreviewSnapshot(
      {
        draftId: 3,
        heroLayout,
        background: { version: 1, type: "variant", variant: "mesh" },
        name: "Bad Belzig",
        selectedBlockId: undefined,
        colorMode: "light",
      },
      { sanitize: (html) => html, logo: null, onIssue: () => {} },
    );

    expect(snapshot?.view.heroLayout?.blocks[0]).toMatchObject({
      align: "center",
      panel: { color: "white", opacity: 100, radius: "md", blur: true },
      offset: { x: 0, y: 0.5 },
      layer: "front",
    });
    expect(snapshot?.view.heroLayout).toEqual(parseHeroLayout(heroLayout));
  });
});


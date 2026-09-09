import { describe, expect, it, vi } from "vitest";

import {
  parseBackground,
  parseHeroLayout,
  type HeroParseIssue,
} from "~~/shared/utils/heroLayout";
import type { HeroImageBlock, HeroRichtextBlock } from "~~/shared/types/hero";

import defaultHeroLayout from "./fixtures/hero-layout/default-hero-layout.json";
import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import backgroundVariant from "./fixtures/hero-layout/background-variant.json";
import backgroundColor from "./fixtures/hero-layout/background-color.json";
import backgroundImage from "./fixtures/hero-layout/background-image.json";
import invalidInputs from "./fixtures/hero-layout/invalid-inputs.json";

/**
 * The fixtures are the JSON examples of the Shared contract and are kept in
 * sync with `smart-city-booking-backend/tests/fixtures/hero-layout/` — see
 * `tests/fixtures/hero-layout/README.md`. Cases that need an over-long or
 * over-long-by-count payload are generated here instead, because a 10 000
 * character string is not something a fixture file should carry.
 */

/** Collects what the guard reported instead of letting it reach the console. */
function withIssues() {
  const issues: HeroParseIssue[] = [];
  return { issues, onIssue: (issue: HeroParseIssue) => issues.push(issue) };
}

function textBlock(id: string) {
  return { id, type: "text", zone: "top-left", text: { de: "Eins" } };
}

describe("parseHeroLayout", () => {
  it("accepts the Default Hero Layout unchanged", () => {
    const layout = parseHeroLayout(defaultHeroLayout);

    expect(layout).toEqual(defaultHeroLayout);
  });

  it("accepts the crowded layout with all three Block types", () => {
    const layout = parseHeroLayout(crowdedHeroLayout);

    expect(layout?.blocks.map((block) => block.type)).toEqual([
      "richtext",
      "text",
      "image",
    ]);
    expect(layout?.height).toBe("xl");

    const richtext = layout?.blocks[0] as HeroRichtextBlock;
    expect(richtext.panel).toBe("translucent");
    expect(richtext.homeOnly).toBe(true);
    expect(richtext.color).toBe("white");
    expect(richtext.html.en).toContain("Opening hours");
  });

  it("keeps a hex colour on a text Block", () => {
    const layout = parseHeroLayout(crowdedHeroLayout);

    expect(layout?.blocks[1]).toMatchObject({ color: "#ff8800" });
  });

  it("drops an empty English translation, so consumers can read `en ?? de`", () => {
    const layout = parseHeroLayout(crowdedHeroLayout);
    const image = layout?.blocks[2] as HeroImageBlock;

    expect(image.alt).toEqual({ de: "Logo" });
    expect("en" in image.alt).toBe(false);
  });

  it("fills every documented default", () => {
    const layout = parseHeroLayout({
      version: 1,
      blocks: [textBlock("a")],
    });

    expect(layout).toEqual({
      version: 1,
      height: "lg",
      mobileHeight: "lg",
      compactHeight: "sm",
      blocks: [
        {
          id: "a",
          type: "text",
          zone: "top-left",
          outerSpacing: "none",
          innerSpacing: "none",
          width: "auto",
          panel: "none",
          homeOnly: false,
          hideOnMobile: false,
          text: { de: "Eins" },
          size: "md",
          color: "default",
          weight: "normal",
          shadow: false,
        },
      ],
    });
  });

  it("accepts an empty layout", () => {
    expect(parseHeroLayout({ version: 1, blocks: [] })?.blocks).toEqual([]);
  });

  it("passes a media reference that has no width and height", () => {
    // The dimensions are backfilled per medium; a Block whose image has not
    // been measured yet still renders, reserving height only.
    const layout = parseHeroLayout({
      version: 1,
      blocks: [
        {
          id: "logo",
          type: "image",
          zone: "middle-right",
          image: { source: "media", mediaId: "66f1c2000000000000000001" },
          alt: { de: "Logo" },
        },
      ],
    });
    const image = layout?.blocks[0] as HeroImageBlock;

    expect(image.image).toEqual({
      source: "media",
      mediaId: "66f1c2000000000000000001",
    });
    expect(image.maxHeight).toBe("md");
  });

  it("keeps the derived keys of an enriched media reference", () => {
    const layout = parseHeroLayout({
      version: 1,
      blocks: [
        {
          id: "logo",
          type: "image",
          zone: "middle-right",
          image: {
            source: "media",
            mediaId: "66f1c2000000000000000001",
            url: "/api/v2/instance/media/66f1c2000000000000000001/file",
            width: 800,
            height: 200,
          },
          alt: { de: "Logo" },
        },
      ],
    });
    const image = layout?.blocks[0] as HeroImageBlock;

    expect(image.image.url).toBe(
      "/api/v2/instance/media/66f1c2000000000000000001/file",
    );
    expect(image.image.width).toBe(800);
    expect(image.image.height).toBe(200);
  });

  it("treats an unusable width as not yet measured rather than rejecting", () => {
    const layout = parseHeroLayout({
      version: 1,
      blocks: [
        {
          id: "logo",
          type: "image",
          zone: "middle-right",
          image: {
            source: "media",
            mediaId: "66f1c2000000000000000001",
            width: null,
            height: 0,
          },
          alt: { de: "Logo" },
        },
      ],
    });
    const image = layout?.blocks[0] as HeroImageBlock;

    expect(image.image.width).toBeUndefined();
    expect(image.image.height).toBeUndefined();
  });

  it("rejects more than twelve Blocks", () => {
    const { issues, onIssue } = withIssues();
    const blocks = Array.from({ length: 13 }, (_, index) =>
      textBlock(`b${index}`),
    );

    expect(parseHeroLayout({ version: 1, blocks }, { onIssue })).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks", code: "max_items" },
    ]);
  });

  it("rejects a text over 200 characters", () => {
    const { issues, onIssue } = withIssues();
    const input = {
      version: 1,
      blocks: [{ ...textBlock("a"), text: { de: "x".repeat(201) } }],
    };

    expect(parseHeroLayout(input, { onIssue })).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].text.de", code: "max_length" },
    ]);
  });

  it("rejects raw rich text over 50 000 characters", () => {
    const { issues, onIssue } = withIssues();
    const input = {
      version: 1,
      blocks: [
        {
          id: "a",
          type: "richtext",
          zone: "bottom-center",
          html: { de: "x".repeat(50_001) },
        },
      ],
    };

    expect(parseHeroLayout(input, { onIssue })).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].html.de", code: "max_length" },
    ]);
  });

  it("passes raw rich text between the two rich-text caps", () => {
    // The 10 000 cap is measured after sanitising, which the guard cannot do —
    // it runs in the browser too. Rejecting raw markup at 10 000 would blank
    // the Hero over input that sanitises to a fraction of it.
    const html = `<p>${"x".repeat(20_000)}</p>`;
    const layout = parseHeroLayout({
      version: 1,
      blocks: [
        { id: "a", type: "richtext", zone: "bottom-center", html: { de: html } },
      ],
    });

    expect(layout?.blocks).toHaveLength(1);
  });

  it("reports only the first failing field", () => {
    const { issues, onIssue } = withIssues();

    expect(
      parseHeroLayout(
        {
          version: 1,
          blocks: [
            { id: "a", type: "text", zone: "nowhere", text: { de: "Eins" } },
            { id: "b", type: "text", zone: "elsewhere", text: { de: "Zwei" } },
          ],
        },
        { onIssue },
      ),
    ).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].zone", code: "invalid_enum" },
    ]);
  });

  it("logs the failing path when no reporter is passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(parseHeroLayout({ version: 3, blocks: [] })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.join(" ")).toContain("heroLayout.version");

    warn.mockRestore();
  });


});

describe("parseBackground", () => {
  it("accepts the three Backgrounds of the contract unchanged", () => {
    expect(parseBackground(backgroundVariant)).toEqual(backgroundVariant);
    expect(parseBackground(backgroundColor)).toEqual(backgroundColor);
    expect(parseBackground(backgroundImage)).toEqual(backgroundImage);
  });

  it("fills the variant defaults", () => {
    expect(parseBackground({ version: 1, type: "variant", variant: "mesh" }))
      .toEqual({
        version: 1,
        type: "variant",
        variant: "mesh",
        orbs: true,
        noise: true,
        intensity: "normal",
      });
  });

  it("leaves a colour Background without a dark colour alone", () => {
    // `dark` falls back to `light` at render time; copying it here would hide
    // from the renderer that no dark colour was configured.
    expect(parseBackground({ version: 1, type: "color", light: "#F3F4F6" })).toEqual(
      { version: 1, type: "color", light: "#F3F4F6" },
    );
  });

  it("falls the dark overlay back to the light one, not to the default", () => {
    // The contract's rule is "`dark` falls back to `light`", so a dark overlay
    // that only sets its opacity keeps the light overlay's colour.
    expect(
      parseBackground({
        version: 1,
        type: "image",
        image: { source: "media", mediaId: "66f1c2000000000000000003" },
        overlay: {
          light: { color: "#123456", opacity: 30 },
          dark: { opacity: 70 },
        },
      }),
    ).toMatchObject({
      overlay: {
        light: { color: "#123456", opacity: 30 },
        dark: { color: "#123456", opacity: 70 },
      },
    });
  });

  it("fills the focal point and the light overlay of an image Background", () => {
    expect(
      parseBackground({
        version: 1,
        type: "image",
        image: { source: "media", mediaId: "66f1c2000000000000000003" },
      }),
    ).toEqual({
      version: 1,
      type: "image",
      image: { source: "media", mediaId: "66f1c2000000000000000003" },
      focalPoint: { x: 50, y: 50 },
      overlay: { light: { color: "#000000", opacity: 40 } },
    });
  });
});

describe("the invalid inputs of the Shared contract", () => {
  for (const testCase of invalidInputs) {
    it(`rejects ${testCase.name}`, () => {
      const { issues, onIssue } = withIssues();
      const parse =
        testCase.target === "background" ? parseBackground : parseHeroLayout;

      expect(parse(testCase.input, { onIssue })).toBeNull();
      expect(issues).toEqual([testCase.expected]);
    });
  }
});

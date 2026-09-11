import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildHeroPreviewSnapshot,
  intendsOverlap,
  measureHeroPreview,
  parseHeroPreviewMessage,
  previewHeroMode,
  type HeroPreviewDraftEnvelope,
  type HeroPreviewMeasuredBlock,
} from "~/utils/heroPreview";
import type { HeroParseIssue } from "~~/shared/utils/heroLayout";
import {
  HERO_BLOCK_OFFSET_NONE,
  type HeroRichtextBlock,
  type HeroZone,
} from "~~/shared/types/hero";

import defaultHeroLayout from "./fixtures/hero-layout/default-hero-layout.json";
import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import backgroundVariant from "./fixtures/hero-layout/background-variant.json";
import backgroundImage from "./fixtures/hero-layout/background-image.json";

describe("previewHeroMode", () => {
  it("maps the mode parameter onto the Hero mode", () => {
    expect(previewHeroMode("home")).toBe("home");
    expect(previewHeroMode("compact")).toBe("compact");
  });

  it("shows the start page when the parameter is absent or unknown", () => {
    expect(previewHeroMode(undefined)).toBe("home");
    expect(previewHeroMode(null)).toBe("home");
    expect(previewHeroMode("")).toBe("home");
    expect(previewHeroMode("account")).toBe("home");
    expect(previewHeroMode(["compact"])).toBe("home");
  });
});

describe("parseHeroPreviewMessage", () => {
  const draft = {
    protocol: 1,
    type: "hero-preview:draft",
    draftId: 7,
    heroLayout: defaultHeroLayout,
    background: backgroundVariant,
    name: "Stadt Musterhausen",
    colorMode: "dark",
  };

  it("accepts a Draft snapshot addressed to this protocol", () => {
    expect(parseHeroPreviewMessage(draft)).toEqual({
      draftId: 7,
      heroLayout: defaultHeroLayout,
      background: backgroundVariant,
      name: "Stadt Musterhausen",
      selectedBlockId: undefined,
      colorMode: "dark",
    });
  });

  it("ignores another protocol version", () => {
    expect(parseHeroPreviewMessage({ ...draft, protocol: 2 })).toBeNull();
    expect(parseHeroPreviewMessage({ ...draft, protocol: "1" })).toBeNull();
  });

  it("ignores an unknown message type", () => {
    expect(
      parseHeroPreviewMessage({ ...draft, type: "hero-preview:ready" }),
    ).toBeNull();
    expect(parseHeroPreviewMessage({ ...draft, type: "reload" })).toBeNull();
  });

  it("ignores anything that is not a message at all", () => {
    expect(parseHeroPreviewMessage(null)).toBeNull();
    expect(parseHeroPreviewMessage("hero-preview:draft")).toBeNull();
    expect(parseHeroPreviewMessage(["hero-preview:draft"])).toBeNull();
    expect(parseHeroPreviewMessage(undefined)).toBeNull();
  });

  it("ignores a Draft without a usable identifier", () => {
    // Without one there is nothing to answer under, so it cannot be reported.
    expect(parseHeroPreviewMessage({ ...draft, draftId: "7" })).toBeNull();
    expect(parseHeroPreviewMessage({ ...draft, draftId: NaN })).toBeNull();
    expect(parseHeroPreviewMessage({ ...draft, draftId: undefined })).toBeNull();
  });

  it("does not validate the Draft's content itself", () => {
    // That is the builder's job: an invalid Draft is still a Draft message,
    // and answering it with `invalid-draft` needs its `draftId`.
    const message = {
      ...draft,
      heroLayout: "nonsense",
      background: null,
      name: null,
      colorMode: "auto",
    };

    expect(parseHeroPreviewMessage(message)).toMatchObject({
      draftId: 7,
      name: null,
      colorMode: "auto",
    });
  });
});

describe("buildHeroPreviewSnapshot", () => {
  const draft: HeroPreviewDraftEnvelope = {
    draftId: 3,
    heroLayout: crowdedHeroLayout,
    background: backgroundImage,
    name: "Stadt Musterhausen",
    selectedBlockId: undefined,
    colorMode: "light",
  };
  const logo = { source: "media" as const, mediaId: "logo-1", url: "/l.png" };

  /** A stand-in for DOMPurify that leaves a mark, so its use is visible. */
  const sanitize = (html: string) => `<p>clean:${html.length}</p>`;

  function richtextOf(view: { heroLayout: { blocks: unknown[] } | null }) {
    return (
      view.heroLayout!.blocks.find(
        (block) => (block as HeroRichtextBlock).type === "richtext",
      ) as HeroRichtextBlock
    ).html;
  }

  function withIssues() {
    const issues: HeroParseIssue[] = [];
    return { issues, onIssue: (issue: HeroParseIssue) => issues.push(issue) };
  }

  function build(envelope: HeroPreviewDraftEnvelope) {
    const { issues, onIssue } = withIssues();
    return { issues, snapshot: buildHeroPreviewSnapshot(envelope, { sanitize, logo, onIssue }) };
  }

  it("builds the view the Hero renders from a valid Draft", () => {
    const { snapshot, issues } = build(draft);

    expect(issues).toEqual([]);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.view.name).toBe("Stadt Musterhausen");
    expect(snapshot!.view.heroLayout!.blocks).toHaveLength(
      crowdedHeroLayout.blocks.length,
    );
    expect(snapshot!.view.background).toEqual(backgroundImage);
    expect(snapshot!.view.logo).toEqual(logo);
    expect(snapshot!.view).not.toHaveProperty("etag");
    expect(snapshot!.colorMode).toBe("light");
    expect(snapshot!.selectedBlockId).toBeNull();
  });

  it("carries the selected Block when the Draft names one", () => {
    const { snapshot } = build({ ...draft, selectedBlockId: "k3Qm7aZp" });

    expect(snapshot!.selectedBlockId).toBe("k3Qm7aZp");
  });

  it("passes every rich-text value through the given sanitiser", () => {
    const block = crowdedHeroLayout.blocks[0] as { html: Record<string, string> };

    const { snapshot } = build(draft);

    expect(richtextOf(snapshot!.view)).toEqual({
      de: `<p>clean:${block.html.de.length}</p>`,
      en: `<p>clean:${block.html.en.length}</p>`,
    });
  });

  it("leaves the Draft's own objects untouched", () => {
    const before = JSON.stringify(draft);

    build(draft);

    expect(JSON.stringify(draft)).toBe(before);
  });

  it("rejects a Draft whose Hero Layout fails the guard, naming the field", () => {
    const layout = {
      ...defaultHeroLayout,
      blocks: [{ ...defaultHeroLayout.blocks[0], zone: "left" }],
    };

    const { snapshot, issues } = build({ ...draft, heroLayout: layout });

    expect(snapshot).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].zone", code: "invalid_enum" },
    ]);
  });

  it("rejects a Draft whose Background fails the guard", () => {
    const { snapshot, issues } = build({
      ...draft,
      background: { ...backgroundVariant, variant: "stripes" },
    });

    expect(snapshot).toBeNull();
    expect(issues).toEqual([
      { path: "background.variant", code: "invalid_enum" },
    ]);
  });

  it("rejects a Draft without a Hero Layout or a Background", () => {
    // A Draft is a whole: the backend's preview endpoint always answers with
    // both, so a missing one is a broken snapshot, not a request for defaults.
    expect(build({ ...draft, heroLayout: null }).snapshot).toBeNull();
    expect(build({ ...draft, background: null }).snapshot).toBeNull();
  });

  it("rejects a Draft whose sanitised rich text is over the contract's cap", () => {
    const { issues, onIssue } = withIssues();

    const snapshot = buildHeroPreviewSnapshot(draft, {
      sanitize: () => "x".repeat(10_001),
      logo,
      onIssue,
    });

    expect(snapshot).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].html.de", code: "max_length" },
    ]);
  });

  it("rejects a Draft whose name, colour mode or selection is malformed, naming the field", () => {
    // These are the admin's own fields, so a wrong one is an admin bug — and
    // an `invalid-draft` answer is how that bug becomes visible there.
    expect(build({ ...draft, name: null })).toMatchObject({
      snapshot: null,
      issues: [{ path: "name", code: "required" }],
    });
    expect(build({ ...draft, colorMode: "auto" })).toMatchObject({
      snapshot: null,
      issues: [{ path: "colorMode", code: "invalid_enum" }],
    });
    expect(build({ ...draft, selectedBlockId: 3 })).toMatchObject({
      snapshot: null,
      issues: [{ path: "selectedBlockId", code: "invalid_format" }],
    });
  });
});

describe("intendsOverlap", () => {
  it("is what an Offset on either axis, or a `front` Layer, says about a Block", () => {
    expect(
      intendsOverlap({ offset: HERO_BLOCK_OFFSET_NONE, layer: "back" }),
    ).toBe(false);
    expect(intendsOverlap({ offset: { x: -0.5, y: 0 }, layer: "back" })).toBe(true);
    expect(intendsOverlap({ offset: { x: 0, y: 3 }, layer: "back" })).toBe(true);
    expect(
      intendsOverlap({ offset: HERO_BLOCK_OFFSET_NONE, layer: "front" }),
    ).toBe(true);
  });

  it("is derived by the bridge from the layout it measured", () => {
    // A measured Block that never got the flag reads as `false`, which would
    // put every deliberate overlap back into the report — and no test here
    // mounts the bridge to catch it.
    const bridge = readFileSync(
      "app/components/hero/HeroPreviewBridge.client.vue",
      "utf8",
    );

    expect(bridge).toMatch(/overlapIntended: intendsOverlap\(block\)/);
  });
});

describe("measureHeroPreview", () => {
  const area = { left: 20, top: 40, right: 1220, bottom: 280 };

  function block(
    id: string,
    zone: HeroZone,
    box: { left: number; top: number; right: number; bottom: number },
    overlapIntended = false,
  ): HeroPreviewMeasuredBlock {
    return { id, zone, box, overlapIntended };
  }

  it("reports nothing for a Block inside the content area", () => {
    const blocks = [block("a", "top-left", { left: 20, top: 40, right: 400, bottom: 100 })];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([]);
  });

  it("reports a Block whose box leaves the content area in any direction", () => {
    const inside = { left: 100, top: 100, right: 300, bottom: 200 };

    for (const box of [
      { ...inside, left: 19 },
      { ...inside, top: 39 },
      { ...inside, right: 1221 },
      { ...inside, bottom: 281 },
    ]) {
      expect(
        measureHeroPreview(area, [block("a", "top-left", box)], "desktop"),
      ).toEqual([{ code: "outside-content-area", blockIds: ["a"] }]);
    }
  });

  it("lets a Block sit on the edge, sub-pixel rounding included", () => {
    // A `width: full` Block ends exactly where the content area ends; the
    // browser's rounding may put it a fraction of a pixel past it.
    const flush = { left: 20, top: 40, right: 1220, bottom: 280 };
    const rounded = { left: 19.7, top: 39.6, right: 1220.4, bottom: 280.3 };

    expect(measureHeroPreview(area, [block("a", "top-left", flush)], "desktop")).toEqual([]);
    expect(measureHeroPreview(area, [block("a", "top-left", rounded)], "desktop")).toEqual([]);
  });

  it("reports two Blocks from different Zones whose boxes intersect, in array order", () => {
    const blocks = [
      block("title", "top-left", { left: 20, top: 40, right: 500, bottom: 160 }),
      block("logo", "middle-left", { left: 20, top: 120, right: 200, bottom: 200 }),
    ];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([
      { code: "overlap", blockIds: ["title", "logo"] },
    ]);
  });

  it("never reports Blocks stacked inside one Zone", () => {
    const blocks = [
      block("title", "middle-left", { left: 20, top: 100, right: 500, bottom: 160 }),
      block("subtitle", "middle-left", { left: 20, top: 150, right: 500, bottom: 200 }),
    ];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([]);
  });

  it("does not count touching edges as an overlap", () => {
    const blocks = [
      block("a", "top-left", { left: 20, top: 40, right: 500, bottom: 160 }),
      block("b", "middle-left", { left: 20, top: 160.3, right: 500, bottom: 200 }),
      block("c", "top-right", { left: 500, top: 40, right: 800, bottom: 160 }),
    ];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([]);
  });

  it("reports every intersecting pair once", () => {
    const box = { left: 100, top: 100, right: 300, bottom: 200 };
    const blocks = [
      block("a", "top-left", box),
      block("b", "middle-center", box),
      block("c", "bottom-right", box),
    ];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([
      { code: "overlap", blockIds: ["a", "b"] },
      { code: "overlap", blockIds: ["a", "c"] },
      { code: "overlap", blockIds: ["b", "c"] },
    ]);
  });

  it("reports only the outside warning on mobile", () => {
    // Mobile stacks the rows; where Blocks land there is not the editor's
    // choice, so an intersection is not something the editor can fix.
    const blocks = [
      block("a", "top-left", { left: 0, top: 40, right: 300, bottom: 160 }),
      block("b", "middle-left", { left: 20, top: 120, right: 200, bottom: 200 }),
    ];

    expect(measureHeroPreview(area, blocks, "mobile")).toEqual([
      { code: "outside-content-area", blockIds: ["a"] },
    ]);
  });

  it("skips a pair whose overlap either Block was told to make", () => {
    // An Offset and a `front` Layer exist to make overlap deliberate, and
    // this is the seam that knows what was rendered — so the report simply
    // never carries the pair, whichever of the two Blocks carries the field.
    const pair = (intended: { title?: boolean; logo?: boolean }) => [
      block("title", "top-left", { left: 20, top: 40, right: 500, bottom: 160 }, intended.title),
      block("logo", "middle-left", { left: 20, top: 120, right: 200, bottom: 200 }, intended.logo),
    ];

    expect(measureHeroPreview(area, pair({ title: true }), "desktop")).toEqual([]);
    expect(measureHeroPreview(area, pair({ logo: true }), "desktop")).toEqual([]);
    expect(
      measureHeroPreview(area, pair({ title: true, logo: true }), "desktop"),
    ).toEqual([]);
    // Two Blocks that only happen to collide are reported as before.
    expect(measureHeroPreview(area, pair({}), "desktop")).toEqual([
      { code: "overlap", blockIds: ["title", "logo"] },
    ]);
  });

  it("reports the other pairs of a Block whose own overlap is deliberate", () => {
    const box = { left: 100, top: 100, right: 300, bottom: 200 };
    const blocks = [
      block("a", "top-left", box),
      block("b", "middle-center", box, true),
      block("c", "bottom-right", box),
    ];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([
      { code: "overlap", blockIds: ["a", "c"] },
    ]);
  });

  it("never suppresses the edge warning, whatever moved the Block there", () => {
    // Leaving the content area means being clipped, or hidden under the
    // search bar — which nobody intends, and which is the very thing an
    // Offset makes likely. It fires in both trees.
    const pushedOut = { left: 100, top: 220, right: 300, bottom: 340 };
    const blocks = [block("a", "bottom-center", pushedOut, true)];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([
      { code: "outside-content-area", blockIds: ["a"] },
    ]);
    expect(measureHeroPreview(area, blocks, "mobile")).toEqual([
      { code: "outside-content-area", blockIds: ["a"] },
    ]);
  });

  it("does not measure a Block without a box", () => {
    // The tree the breakpoint hides answers an all-zero box for every Block.
    const blocks = [
      block("a", "top-left", { left: 0, top: 0, right: 0, bottom: 0 }),
      block("b", "middle-left", { left: 0, top: 0, right: 0, bottom: 0 }),
    ];

    expect(measureHeroPreview(area, blocks, "desktop")).toEqual([]);
  });
});

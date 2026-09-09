import { describe, expect, it } from "vitest";

import {
  buildHeroPreviewSnapshot,
  parseHeroPreviewMessage,
  previewHeroMode,
  type HeroPreviewDraftEnvelope,
} from "~/utils/heroPreview";
import type { HeroParseIssue } from "~~/shared/utils/heroLayout";
import type { HeroRichtextBlock } from "~~/shared/types/hero";

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

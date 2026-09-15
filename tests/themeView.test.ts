import { describe, expect, it } from "vitest";

import { buildThemeView, defaultThemeView } from "~~/server/utils/themeView";
import type { HeroParseIssue } from "~~/shared/utils/heroLayout";
import type { HeroRichtextBlock } from "~~/shared/types/hero";

import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import backgroundVariant from "./fixtures/hero-layout/background-variant.json";

/** Collects what the guards reported instead of letting it reach the log. */
function withIssues() {
  const issues: HeroParseIssue[] = [];
  return { issues, onIssue: (issue: HeroParseIssue) => issues.push(issue) };
}

function bundleWith(overrides: Record<string, unknown> = {}) {
  return {
    name: "Marktplatz Musterstadt",
    heroLayout: crowdedHeroLayout,
    background: backgroundVariant,
    logo: {
      source: "media",
      mediaId: "66f1c2000000000000000009",
      url: "/api/media/66f1c2000000000000000009",
      width: 320,
      height: 80,
    },
    ...overrides,
  };
}

function richtextOf(view: { heroLayout: { blocks: unknown[] } | null }) {
  const block = view.heroLayout?.blocks.find(
    (candidate) => (candidate as HeroRichtextBlock).type === "richtext",
  );
  return (block as HeroRichtextBlock).html;
}

describe("buildThemeView", () => {
  it("carries the etag, the Portal Name, the layout, the Background and the logo", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(bundleWith(), "abc123", { onIssue });

    expect(view.etag).toBe("abc123");
    expect(view.name).toBe("Marktplatz Musterstadt");
    expect(view.heroLayout?.height).toBe("xl");
    expect(view.background?.type).toBe("variant");
    expect(view.logo?.mediaId).toBe("66f1c2000000000000000009");
    expect(issues).toEqual([]);
  });

  it("leaves rich text that is already within the allowlist untouched", () => {
    const view = buildThemeView(bundleWith(), "abc123", withIssues());

    expect(richtextOf(view).de).toBe(
      '<p><strong>Öffnungszeiten:</strong> Mo–Fr 8–18 Uhr. <a href="mailto:info@example.org">Kontakt</a></p>',
    );
  });

  it("sanitises the rich text of a Block in every locale it carries", () => {
    const layout = structuredClone(crowdedHeroLayout) as {
      blocks: Array<Record<string, unknown>>;
    };
    const block = layout.blocks.find((b) => b.type === "richtext")!;
    block.html = {
      de: '<p>Hallo<script>alert(1)</script></p>',
      en: '<p onclick="steal()">Hello</p>',
    };

    const view = buildThemeView(bundleWith({ heroLayout: layout }), "e", withIssues());

    expect(richtextOf(view).de).toBe("<p>Hallo</p>");
    expect(richtextOf(view).en).toBe("<p>Hello</p>");
  });

  it("rejects the layout when sanitised rich text is over the contract's cap", () => {
    const layout = structuredClone(crowdedHeroLayout) as {
      blocks: Array<Record<string, unknown>>;
    };
    const block = layout.blocks.find((b) => b.type === "richtext")!;
    block.html = { de: `<p>${"a".repeat(10_001)}</p>` };
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(bundleWith({ heroLayout: layout }), "e", {
      onIssue,
    });

    expect(view.heroLayout).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].html.de", code: "max_length" },
    ]);
  });

  it("keeps the name and the logo when the layout is rejected", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(bundleWith({ heroLayout: { version: 7 } }), "e", {
      onIssue,
    });

    expect(view.heroLayout).toBeNull();
    expect(view.name).toBe("Marktplatz Musterstadt");
    expect(view.logo?.mediaId).toBe("66f1c2000000000000000009");
    expect(issues).toHaveLength(1);
  });

  it("reports no issue for a bundle that simply carries no logo", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(bundleWith({ logo: null }), "e", { onIssue });

    expect(view.logo).toBeNull();
    expect(issues).toEqual([]);
  });

  it("falls back to an empty Portal Name rather than inventing one", () => {
    const view = buildThemeView(bundleWith({ name: undefined }), "e", withIssues());

    expect(view.name).toBe("");
  });
});

describe("defaultThemeView", () => {
  it("is a complete Theme View that asks the renderer for its fallbacks", () => {
    expect(defaultThemeView()).toEqual({
      etag: "default",
      name: "",
      heroLayout: null,
      background: null,
      logo: null,
    });
  });
});

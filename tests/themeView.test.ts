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

  it.each(["sm", "md", "lg"])(
    "carries the size of the logo on the auth pages, %s",
    (size) => {
      const view = buildThemeView(bundleWith({ authLogoSize: size }), "e", withIssues());

      expect(view.authLogoSize).toBe(size);
    },
  );

  it.each([undefined, null, "xl", "", 3])(
    "reads the size of the logo on the auth pages as S when it is %s",
    (size) => {
      const { issues, onIssue } = withIssues();

      const view = buildThemeView(bundleWith({ authLogoSize: size }), "e", {
        onIssue,
      });

      expect(view.authLogoSize).toBe("sm");
      expect(issues).toEqual([]);
    },
  );
});

describe("buildThemeView, footer logos", () => {
  function footerImage(id: string, name: string) {
    return {
      source: "media",
      mediaId: id,
      url: `/api/v2/instance/media/${id}/file`,
      width: 600,
      height: 200,
      name,
    };
  }

  it("carries the footer logos in their order, each with its image, size, link and variant", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(
      bundleWith({
        footerLogos: [
          {
            image: footerImage("66f1c20000000000000000f1", "Gefördert vom BMWSB"),
            size: "lg",
            link: "https://www.bmwsb.bund.de/",
            imageDark: null,
          },
          {
            image: footerImage("66f1c20000000000000000f2", "Stadtwerke"),
            size: "sm",
            link: "",
            imageDark: footerImage("66f1c20000000000000000f3", "Stadtwerke hell"),
          },
        ],
      }),
      "e",
      { onIssue },
    );

    expect(view.footerLogos).toEqual([
      {
        image: {
          source: "media",
          mediaId: "66f1c20000000000000000f1",
          url: "/api/v2/instance/media/66f1c20000000000000000f1/file",
          width: 600,
          height: 200,
          name: "Gefördert vom BMWSB",
        },
        size: "lg",
        link: "https://www.bmwsb.bund.de/",
        imageDark: null,
      },
      {
        image: {
          source: "media",
          mediaId: "66f1c20000000000000000f2",
          url: "/api/v2/instance/media/66f1c20000000000000000f2/file",
          width: 600,
          height: 200,
          name: "Stadtwerke",
        },
        size: "sm",
        link: "",
        imageDark: {
          source: "media",
          mediaId: "66f1c20000000000000000f3",
          url: "/api/v2/instance/media/66f1c20000000000000000f3/file",
          width: 600,
          height: 200,
          name: "Stadtwerke hell",
        },
      },
    ]);
    expect(issues).toEqual([]);
  });

  it.each([undefined, null, []])(
    "has no footer logos, and reports nothing, when the bundle carries %s",
    (footerLogos) => {
      const { issues, onIssue } = withIssues();

      const view = buildThemeView(bundleWith({ footerLogos }), "e", { onIssue });

      expect(view.footerLogos).toEqual([]);
      expect(issues).toEqual([]);
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//evil.example/",
    "/relative",
    42,
  ])("never turns %s into a link, and keeps the logo", (link) => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(
      bundleWith({
        footerLogos: [
          { image: footerImage("66f1c20000000000000000f1", "Logo"), size: "md", link, imageDark: null },
        ],
      }),
      "e",
      { onIssue },
    );

    expect(view.footerLogos).toHaveLength(1);
    expect(view.footerLogos[0]!.link).toBe("");
    expect(issues).toEqual([{ path: "footerLogos[0].link", code: "invalid_format" }]);
  });

  it("drops a logo whose image fails on its own and keeps the others", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(
      bundleWith({
        footerLogos: [
          { image: { source: "external", url: "https://evil.example/x.png" }, size: "md", link: "" },
          { image: footerImage("66f1c20000000000000000f2", "Stadtwerke"), size: "md", link: "" },
        ],
      }),
      "e",
      { onIssue },
    );

    expect(view.footerLogos.map((logo) => logo.image.name)).toEqual(["Stadtwerke"]);
    expect(issues).toEqual([{ path: "footerLogos[0].image.source", code: "invalid_custom" }]);
  });

  it("drops a logo, or its variant, that carries no address to show", () => {
    const { issues, onIssue } = withIssues();
    const { url: _url, ...unaddressed } = footerImage("66f1c20000000000000000f9", "Ohne URL");

    const view = buildThemeView(
      bundleWith({
        footerLogos: [
          { image: unaddressed, size: "md", link: "" },
          { image: footerImage("66f1c20000000000000000f2", "Stadtwerke"), size: "md", link: "", imageDark: unaddressed },
        ],
      }),
      "e",
      { onIssue },
    );

    expect(view.footerLogos).toHaveLength(1);
    expect(view.footerLogos[0]!.image.name).toBe("Stadtwerke");
    expect(view.footerLogos[0]!.imageDark).toBeNull();
    expect(issues).toEqual([
      { path: "footerLogos[0].image.url", code: "required" },
      { path: "footerLogos[1].imageDark.url", code: "required" },
    ]);
  });

  it("shows the plate rather than a broken variant", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(
      bundleWith({
        footerLogos: [
          {
            image: footerImage("66f1c20000000000000000f1", "Logo"),
            size: "md",
            link: "",
            imageDark: { source: "media", mediaId: "" },
          },
        ],
      }),
      "e",
      { onIssue },
    );

    expect(view.footerLogos[0]!.imageDark).toBeNull();
    expect(issues).toEqual([{ path: "footerLogos[0].imageDark.mediaId", code: "required" }]);
  });

  it.each([undefined, "xl", 3])("reads the size %s as M", (size) => {
    const view = buildThemeView(
      bundleWith({
        footerLogos: [{ image: footerImage("66f1c20000000000000000f1", "Logo"), size, link: "" }],
      }),
      "e",
      withIssues(),
    );

    expect(view.footerLogos[0]!.size).toBe("md");
  });
});

describe("the variant of the logo for the dark mode", () => {
  const dark = {
    source: "media",
    mediaId: "66f1c200000000000000000d",
    url: "/api/v2/instance/media/66f1c200000000000000000d/file",
    width: 200,
    height: 100,
  };

  it("travels beside the logo, with its own dimensions", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(bundleWith({ logoDark: dark }), "e", { onIssue });

    expect(view.logoDark).toEqual(dark);
    expect(view.logo?.mediaId).toBe("66f1c2000000000000000009");
    expect(issues).toEqual([]);
  });

  it.each([undefined, null])(
    "is null without a report when the bundle carries %s",
    (logoDark) => {
      const { issues, onIssue } = withIssues();

      const view = buildThemeView(bundleWith({ logoDark }), "e", { onIssue });

      expect(view.logoDark).toBeNull();
      expect(issues).toEqual([]);
    },
  );

  it("is null on its own when it fails the guard, and costs the logo nothing", () => {
    const { issues, onIssue } = withIssues();

    const view = buildThemeView(
      bundleWith({ logoDark: { source: "url", url: "https://evil.example/x.png" } }),
      "e",
      { onIssue },
    );

    expect(view.logoDark).toBeNull();
    expect(view.logo?.mediaId).toBe("66f1c2000000000000000009");
    expect(issues).toHaveLength(1);
    expect(issues[0].path).toMatch(/^logoDark/);
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
      logoDark: null,
      authLogoSize: "sm",
      footerLogos: [],
    });
  });
});

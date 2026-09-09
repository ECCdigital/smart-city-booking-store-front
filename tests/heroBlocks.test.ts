import { describe, expect, it } from "vitest";

import {
  blocksInZone,
  fallbackHeroLayout,
  heroHeightSteps,
  localizedText,
  mobileRows,
  visibleBlocks,
  zoneColumn,
  zoneRow,
} from "~/utils/heroBlocks";
import type { HeroLayout } from "~~/shared/types/hero";

import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";
import defaultHeroLayout from "./fixtures/hero-layout/default-hero-layout.json";

const logo = {
  source: "media" as const,
  mediaId: "66f1c2000000000000000001",
  url: "/api/v2/instance/media/66f1c2000000000000000001/file",
  width: 320,
  height: 80,
};

describe("fallbackHeroLayout", () => {
  it("has the shape of the Default Hero Layout: logo, title and subtitle in the middle row", () => {
    const layout = fallbackHeroLayout({
      title: "Marktplatz",
      subtitle: "Entdecken Sie unsere Angebote",
      logo,
    });

    const expected = structuredClone(defaultHeroLayout);
    expected.blocks[0]!.image = logo;
    expected.blocks[2]!.text = { de: "Entdecken Sie unsere Angebote" };

    expect(layout).toEqual(expected);
  });

  it("leaves the logo Block out when no logo is known", () => {
    const layout = fallbackHeroLayout({
      title: "Marktplatz",
      subtitle: "Entdecken Sie unsere Angebote",
      logo: null,
    });

    expect(layout.blocks.map((block) => block.id)).toEqual([
      "default-title",
      "default-subtitle",
    ]);
  });
});

describe("heroHeightSteps", () => {
  const layout = {
    ...defaultHeroLayout,
    height: "xl",
    mobileHeight: "md",
    compactHeight: "sm",
  } as HeroLayout;

  it("gives the home Hero its desktop and its mobile height", () => {
    expect(heroHeightSteps(layout, "home")).toEqual({
      desktop: "xl",
      mobile: "md",
    });
  });

  it("gives the Compact Hero its own height on every viewport", () => {
    expect(heroHeightSteps(layout, "compact")).toEqual({
      desktop: "sm",
      mobile: "sm",
    });
  });
});

describe("a Zone", () => {
  it("is a row and a column", () => {
    expect(zoneRow("top-left")).toBe("top");
    expect(zoneColumn("top-left")).toBe("left");
    expect(zoneRow("middle-center")).toBe("middle");
    expect(zoneColumn("middle-center")).toBe("center");
    expect(zoneRow("bottom-right")).toBe("bottom");
    expect(zoneColumn("bottom-right")).toBe("right");
  });
});

describe("the Blocks of a Hero Layout", () => {
  const crowded = crowdedHeroLayout as HeroLayout;
  const ids = (blocks: { id: string }[]) => blocks.map((block) => block.id);

  it("all render in the home Hero, in array order", () => {
    expect(ids(visibleBlocks(crowded, "home"))).toEqual(ids(crowded.blocks));
  });

  it("marked home-only stay out of the Compact Hero", () => {
    const homeOnly = crowded.blocks.filter((block) => block.homeOnly);
    expect(homeOnly.length).toBeGreaterThan(0);

    const visible = visibleBlocks(crowded, "compact");
    expect(visible.some((block) => block.homeOnly)).toBe(false);
    expect(visible.length).toBe(crowded.blocks.length - homeOnly.length);
  });

  it("stack inside their Zone in array order", () => {
    const layout = defaultHeroLayout as HeroLayout;
    expect(ids(blocksInZone(layout.blocks, "middle-left"))).toEqual([
      "default-title",
      "default-subtitle",
    ]);
    expect(ids(blocksInZone(layout.blocks, "middle-right"))).toEqual([
      "default-logo",
    ]);
    expect(blocksInZone(layout.blocks, "top-center")).toEqual([]);
  });

  it("group into top, middle and bottom rows on mobile, array order inside a row", () => {
    const rows = mobileRows(crowded.blocks);

    expect(rows.map((row) => row.row)).toEqual(["top", "middle", "bottom"]);
    for (const { row, blocks } of rows) {
      const expected = crowded.blocks.filter(
        (block) => zoneRow(block.zone) === row && !block.hideOnMobile,
      );
      expect(ids(blocks)).toEqual(ids(expected));
    }
  });

  it("marked hide-on-mobile are not in any mobile row", () => {
    const hidden = crowded.blocks.filter((block) => block.hideOnMobile);
    expect(hidden.length).toBeGreaterThan(0);

    const shown = mobileRows(crowded.blocks).flatMap((row) => row.blocks);
    expect(shown.some((block) => block.hideOnMobile)).toBe(false);
  });
});

describe("localizedText", () => {
  it("reads the current locale and falls back to German", () => {
    const text = { de: "Entdecken Sie unsere Angebote", en: "Discover our offers" };
    expect(localizedText(text, "en")).toBe("Discover our offers");
    expect(localizedText(text, "de")).toBe("Entdecken Sie unsere Angebote");
    expect(localizedText({ de: "Nur Deutsch" }, "en")).toBe("Nur Deutsch");
  });
});

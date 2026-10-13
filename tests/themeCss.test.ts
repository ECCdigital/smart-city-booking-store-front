import { describe, expect, it } from "vitest";

import { renderThemeCss } from "~~/server/utils/themeCss";

/**
 * The stylesheet routes render from the Theme Bundle rather than from a cached
 * handler, so the render itself is memoised per etag — the etag is the
 * identity of the bundle's content (storefront ADR 0001).
 */

const DEFAULTS = { primary: "#FF8B00", secondary: "#1D9ECC" };

describe("renderThemeCss", () => {
  it("declares the bundle's colours for both colour modes", () => {
    const css = renderThemeCss({
      etag: "v-both-modes",
      colors: { primary: "#112233", secondary: "#445566" },
      defaults: DEFAULTS,
    });

    expect(css).toContain(":root");
    expect(css).toContain(".dark");
    expect(css.match(/--ui-primary: #112233/g)).toHaveLength(2);
    expect(css.match(/--ui-secondary: #445566/g)).toHaveLength(2);
  });

  it("falls back to the given defaults when the bundle carries no colours", () => {
    const css = renderThemeCss({ etag: "v-none", colors: null, defaults: DEFAULTS });

    expect(css).toContain("--ui-primary: #FF8B00");
    expect(css).toContain("--ui-secondary: #1D9ECC");
  });

  it("falls back when only one of the two colours is configured", () => {
    const css = renderThemeCss({
      etag: "v-half",
      colors: { primary: "#112233" },
      defaults: DEFAULTS,
    });

    expect(css).toContain("--ui-primary: #FF8B00");
    expect(css).toContain("--ui-secondary: #1D9ECC");
  });

  it("renders once per etag: the same etag never re-renders", () => {
    const first = renderThemeCss({
      etag: "memo-1",
      colors: { primary: "#112233", secondary: "#445566" },
      defaults: DEFAULTS,
    });
    const second = renderThemeCss({
      etag: "memo-1",
      colors: { primary: "#999999", secondary: "#888888" },
      defaults: DEFAULTS,
    });

    expect(second).toBe(first);
    expect(second).not.toContain("#999999");
  });

  it("renders again when the etag changes", () => {
    renderThemeCss({
      etag: "memo-2",
      colors: { primary: "#112233", secondary: "#445566" },
      defaults: DEFAULTS,
    });
    const next = renderThemeCss({
      etag: "memo-3",
      colors: { primary: "#999999", secondary: "#888888" },
      defaults: DEFAULTS,
    });

    expect(next).toContain("--ui-primary: #999999");
  });

  it("keeps the two stylesheet routes apart under one etag", () => {
    const instance = renderThemeCss({
      etag: "shared",
      colors: null,
      defaults: DEFAULTS,
    });
    const slug = renderThemeCss({
      etag: "shared",
      colors: null,
      defaults: { primary: "#3b82f6", secondary: "#10b981" },
    });

    expect(instance).toContain("#FF8B00");
    expect(slug).toContain("#3b82f6");
  });

  it("keeps the short hex, named and functional colours CSS allows", () => {
    for (const [index, pair] of [
      { primary: "#fff", secondary: "#000" },
      { primary: "rebeccapurple", secondary: "teal" },
      { primary: "rgb(17, 34, 51)", secondary: "hsl(210, 50%, 40%)" },
    ].entries()) {
      const css = renderThemeCss({
        etag: `v-css-colors-${index}`,
        colors: pair,
        defaults: DEFAULTS,
      });

      expect(css).toContain(`--ui-primary: ${pair.primary}`);
      expect(css).toContain(`--ui-secondary: ${pair.secondary}`);
    }
  });

  it("refuses a colour that could end the declaration", () => {
    const css = renderThemeCss({
      etag: "v-injection",
      colors: { primary: "red; } * { display: none }", secondary: "#445566" },
      defaults: DEFAULTS,
    });

    expect(css).not.toContain("display: none");
    expect(css).toContain("--ui-primary: #FF8B00");
  });
});

/**
 * The contrast colours are rendered on the server so the text on primary,
 * secondary and the header has its colour in the first paint (map #510). The
 * rule is the one `useContrastColor` applied on the client: luma above 180
 * gives black, anything else white.
 */
describe("renderThemeCss: contrast colours", () => {
  function declarations(css: string, name: string): string[] {
    return [...css.matchAll(new RegExp(`${name}: ([^;]+);`, "g"))].map((match) => match[1]!);
  }

  it("gives white text on a dark colour, in both colour modes", () => {
    const css = renderThemeCss({
      etag: "contrast-dark",
      colors: { primary: "#112233", secondary: "#1D9ECC" },
      defaults: DEFAULTS,
    });

    expect(declarations(css, "--ui-primary-contrast")).toEqual(["#ffffff", "#ffffff"]);
    expect(declarations(css, "--ui-secondary-contrast")).toEqual(["#ffffff", "#ffffff"]);
  });

  it("gives black text on a light #rrggbb colour", () => {
    const css = renderThemeCss({
      etag: "contrast-light-long",
      colors: { primary: "#FFE066", secondary: "#f0f0f0" },
      defaults: DEFAULTS,
    });

    expect(declarations(css, "--ui-primary-contrast")).toEqual(["#000000", "#000000"]);
    expect(declarations(css, "--ui-secondary-contrast")).toEqual(["#000000", "#000000"]);
  });

  it("turns black only above a luma of 180", () => {
    // #b4b4b4 has a luma of exactly 180, #b5b5b5 one of 181.
    const css = renderThemeCss({
      etag: "contrast-threshold",
      colors: { primary: "#b4b4b4", secondary: "#b5b5b5" },
      defaults: DEFAULTS,
    });

    expect(declarations(css, "--ui-primary-contrast")[0]).toBe("#ffffff");
    expect(declarations(css, "--ui-secondary-contrast")[0]).toBe("#000000");
  });

  it("computes the short #rgb form like its long form", () => {
    const css = renderThemeCss({
      etag: "contrast-short",
      colors: { primary: "#fe6", secondary: "#123" },
      defaults: DEFAULTS,
    });

    expect(declarations(css, "--ui-primary-contrast")).toEqual(["#000000", "#000000"]);
    expect(declarations(css, "--ui-secondary-contrast")).toEqual(["#ffffff", "#ffffff"]);
  });

  it("gives white for colour names, rgb() and other hex lengths", () => {
    for (const [index, pair] of [
      { primary: "white", secondary: "yellow" },
      { primary: "rgb(255, 255, 255)", secondary: "hsl(0, 0%, 100%)" },
      { primary: "#ffffffff", secondary: "#ffff" },
    ].entries()) {
      const css = renderThemeCss({
        etag: `contrast-other-${index}`,
        colors: pair,
        defaults: DEFAULTS,
      });

      expect(declarations(css, "--ui-primary-contrast")).toEqual(["#ffffff", "#ffffff"]);
      expect(declarations(css, "--ui-secondary-contrast")).toEqual(["#ffffff", "#ffffff"]);
    }
  });

  it("gives the contrast of the default pair when the defaults apply", () => {
    const css = renderThemeCss({
      etag: "contrast-defaults",
      // A light primary that would give black, but the pair is invalid.
      colors: { primary: "#ffe066", secondary: "red; }" },
      defaults: { primary: "#123456", secondary: "#ffe066" },
    });

    expect(declarations(css, "--ui-primary-contrast")).toEqual(["#ffffff", "#ffffff"]);
    expect(declarations(css, "--ui-secondary-contrast")).toEqual(["#000000", "#000000"]);
  });
});

/**
 * The header bar reads only `--ui-header` and `--ui-header-contrast`, and the
 * Theme Bundle's `header` decides what they hold (map #510): primary as
 * before, secondary, or a neutral bar fixed per colour mode.
 */
describe("renderThemeCss: header", () => {
  const COLORS = { primary: "#ffe066", secondary: "#123456" };

  /** The declarations of one block (`:root` or `.dark`), by name. */
  function block(css: string, selector: ":root" | ".dark"): Record<string, string> {
    const start = css.indexOf(`${selector} {`);
    const body = css.slice(start, css.indexOf("}", start));
    return Object.fromEntries(
      [...body.matchAll(/(--[\w-]+): ([^;]+);/g)].map((match) => [match[1]!, match[2]!]),
    );
  }

  it("stands in primary without a header setting, as before", () => {
    const css = renderThemeCss({ etag: "header-none", colors: COLORS, defaults: DEFAULTS });

    for (const selector of [":root", ".dark"] as const) {
      expect(block(css, selector)["--ui-header"]).toBe("#ffe066");
      expect(block(css, selector)["--ui-header-contrast"]).toBe("#000000");
    }
  });

  it("takes primary and its contrast for a primary header", () => {
    const css = renderThemeCss({
      etag: "header-primary",
      colors: COLORS,
      header: "primary",
      defaults: DEFAULTS,
    });

    for (const selector of [":root", ".dark"] as const) {
      expect(block(css, selector)["--ui-header"]).toBe("#ffe066");
      expect(block(css, selector)["--ui-header-contrast"]).toBe("#000000");
    }
  });

  it("takes secondary and its contrast for a secondary header", () => {
    const css = renderThemeCss({
      etag: "header-secondary",
      colors: COLORS,
      header: "secondary",
      defaults: DEFAULTS,
    });

    for (const selector of [":root", ".dark"] as const) {
      expect(block(css, selector)["--ui-header"]).toBe("#123456");
      expect(block(css, selector)["--ui-header-contrast"]).toBe("#ffffff");
    }
  });

  it("stands neutral without any computing: white in light, the footer's ground in dark", () => {
    const css = renderThemeCss({
      etag: "header-neutral",
      colors: COLORS,
      header: "neutral",
      defaults: DEFAULTS,
    });
    const light = block(css, ":root");
    const dark = block(css, ".dark");

    expect(light["--ui-header"]).toBe("#ffffff");
    // gray-900, the near-black of the app's text and the footer's dark ground.
    expect(light["--ui-header-contrast"]).toBe("#101828");
    expect(dark["--ui-header"]).toBe("#101828");
    expect(dark["--ui-header-contrast"]).toBe("#ffffff");
  });

  it("reads an unknown header as primary, and none of it reaches the CSS", () => {
    const css = renderThemeCss({
      etag: "header-unknown",
      colors: COLORS,
      header: "red; } * { display: none }",
      defaults: DEFAULTS,
    });

    expect(css).not.toContain("display: none");
    expect(block(css, ":root")["--ui-header"]).toBe("#ffe066");
    expect(block(css, ".dark")["--ui-header"]).toBe("#ffe066");
  });

  it("puts the active tab in secondary with a primary stripe, as before", () => {
    for (const header of [undefined, "primary", "neutral"]) {
      const css = renderThemeCss({
        etag: `header-active-${header}`,
        colors: COLORS,
        header,
        defaults: DEFAULTS,
      });

      for (const selector of [":root", ".dark"] as const) {
        expect(block(css, selector)["--ui-header-active"]).toBe("#123456");
        expect(block(css, selector)["--ui-header-active-contrast"]).toBe("#ffffff");
        expect(block(css, selector)["--ui-header-active-stripe"]).toBe("#ffe066");
      }
    }
  });

  it("keeps the solid button white on black in light and black on white in dark on a coloured header, as before", () => {
    for (const header of [undefined, "primary", "secondary"]) {
      const css = renderThemeCss({
        etag: `header-button-${header}`,
        colors: COLORS,
        header,
        defaults: DEFAULTS,
      });

      expect(block(css, ":root")["--ui-header-button"]).toBe("#ffffff");
      expect(block(css, ":root")["--ui-header-button-contrast"]).toBe("#000000");
      expect(block(css, ".dark")["--ui-header-button"]).toBe("#000000");
      expect(block(css, ".dark")["--ui-header-button-contrast"]).toBe("#ffffff");
    }
  });

  it("turns the solid button around on a neutral header, so it stands out from the bar", () => {
    const css = renderThemeCss({
      etag: "header-button-neutral",
      colors: COLORS,
      header: "neutral",
      defaults: DEFAULTS,
    });
    const light = block(css, ":root");
    const dark = block(css, ".dark");

    expect(light["--ui-header-button"]).toBe("#101828");
    expect(light["--ui-header-button-contrast"]).toBe("#ffffff");
    expect(dark["--ui-header-button"]).toBe("#ffffff");
    expect(dark["--ui-header-button-contrast"]).toBe("#101828");
    expect(light["--ui-header-button"]).not.toBe(light["--ui-header"]);
    expect(dark["--ui-header-button"]).not.toBe(dark["--ui-header"]);
  });

  it("puts the active tab in primary with a secondary stripe on a secondary header", () => {
    const css = renderThemeCss({
      etag: "header-active-secondary",
      colors: COLORS,
      header: "secondary",
      defaults: DEFAULTS,
    });

    for (const selector of [":root", ".dark"] as const) {
      expect(block(css, selector)["--ui-header-active"]).toBe("#ffe066");
      expect(block(css, selector)["--ui-header-active-contrast"]).toBe("#000000");
      expect(block(css, selector)["--ui-header-active-stripe"]).toBe("#123456");
    }
  });
});


/**
 * The accent is optional (map #510): it is declared only when the instance set
 * a valid one, so every element that wears it can fall back with
 * `var(--ui-accent, …)` to what it showed before there was an accent.
 */
describe("renderThemeCss: accent", () => {
  const COLORS = { primary: "#112233", secondary: "#445566" };

  /** The declarations of one block (`:root` or `.dark`), by name. */
  function block(css: string, selector: ":root" | ".dark"): Record<string, string> {
    const start = css.indexOf(`${selector} {`);
    const body = css.slice(start, css.indexOf("}", start));
    return Object.fromEntries(
      [...body.matchAll(/(--[\w-]+): ([^;]+);/g)].map((match) => [match[1]!, match[2]!]),
    );
  }

  it("declares a set accent and its contrast, the same in both colour modes", () => {
    const css = renderThemeCss({
      etag: "accent-set",
      colors: { ...COLORS, accent: "#7c3aed" },
      defaults: DEFAULTS,
    });

    for (const selector of [":root", ".dark"] as const) {
      expect(block(css, selector)["--ui-accent"]).toBe("#7c3aed");
      expect(block(css, selector)["--ui-accent-contrast"]).toBe("#ffffff");
    }
  });

  it("gives black text on a light accent, short or long", () => {
    for (const [index, accent] of ["#FFE066", "#fe6"].entries()) {
      const css = renderThemeCss({
        etag: `accent-light-${index}`,
        colors: { ...COLORS, accent },
        defaults: DEFAULTS,
      });

      expect(block(css, ":root")["--ui-accent-contrast"]).toBe("#000000");
      expect(block(css, ".dark")["--ui-accent-contrast"]).toBe("#000000");
    }
  });

  it("declares neither variable without an accent", () => {
    for (const [index, accent] of [undefined, "", "   "].entries()) {
      const css = renderThemeCss({
        etag: `accent-unset-${index}`,
        colors: { ...COLORS, accent },
        defaults: DEFAULTS,
      });

      expect(css).not.toContain("--ui-accent");
    }
  });

  it("drops an accent that could end the declaration and leaves the pair alone", () => {
    const css = renderThemeCss({
      etag: "accent-injection",
      colors: { ...COLORS, accent: "red; } * { display: none }" },
      defaults: DEFAULTS,
    });

    expect(css).not.toContain("display: none");
    expect(css).not.toContain("--ui-accent");
    for (const selector of [":root", ".dark"] as const) {
      expect(block(css, selector)["--ui-primary"]).toBe("#112233");
      expect(block(css, selector)["--ui-secondary"]).toBe("#445566");
    }
  });

  it("keeps a valid accent when the pair falls back to the defaults", () => {
    const css = renderThemeCss({
      etag: "accent-default-pair",
      colors: { primary: "#112233", accent: "#7c3aed" },
      defaults: DEFAULTS,
    });

    expect(block(css, ":root")["--ui-primary"]).toBe("#FF8B00");
    expect(block(css, ":root")["--ui-accent"]).toBe("#7c3aed");
  });
});

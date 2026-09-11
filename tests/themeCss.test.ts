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

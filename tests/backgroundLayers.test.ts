import { describe, expect, it } from "vitest";

import {
  backgroundRootStyle,
  resolveBackground,
} from "~/utils/backgroundLayers";

import backgroundColor from "./fixtures/hero-layout/background-color.json";
import backgroundVariant from "./fixtures/hero-layout/background-variant.json";
import type { Background } from "~~/shared/types/hero";

describe("resolveBackground", () => {
  it("paints the default Background — today's poly — when the Theme View has none", () => {
    expect(resolveBackground(null)).toEqual({
      version: 1,
      type: "variant",
      variant: "poly",
      orbs: true,
      noise: true,
      intensity: "normal",
    });
  });

  it("leaves a stored Background as it is", () => {
    expect(resolveBackground(backgroundColor as Background)).toBe(
      backgroundColor,
    );
  });
});

describe("backgroundRootStyle", () => {
  it("hands a flat colour to the stylesheet as its light and dark custom properties", () => {
    expect(backgroundRootStyle(backgroundColor as Background)).toEqual({
      "--bg-light": "#f3f4f6",
      "--bg-dark": "#111827",
    });
  });

  it("paints the light colour in dark mode when no dark colour is configured", () => {
    const background: Background = {
      version: 1,
      type: "color",
      light: "#f3f4f6",
    };

    expect(backgroundRootStyle(background)).toEqual({
      "--bg-light": "#f3f4f6",
      "--bg-dark": "#f3f4f6",
    });
  });

  it("puts nothing inline for a Variant — its palette lives in the stylesheet", () => {
    expect(backgroundRootStyle(backgroundVariant as Background)).toBeUndefined();
  });
});

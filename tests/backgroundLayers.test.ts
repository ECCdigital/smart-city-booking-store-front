import { describe, expect, it } from "vitest";

import {
  backgroundRootStyle,
  coverImageSizes,
  imageLayer,
  resolveBackground,
} from "~/utils/backgroundLayers";

import backgroundColor from "./fixtures/hero-layout/background-color.json";
import backgroundImage from "./fixtures/hero-layout/background-image.json";
import backgroundVariant from "./fixtures/hero-layout/background-variant.json";
import type { Background, ImageBackground } from "~~/shared/types/hero";

const mediaUrl = "/api/v2/instance/media/66f1c2000000000000000003/file";

function proxied(preset: string): string {
  return `/api/img?url=${encodeURIComponent(`${mediaUrl}?size=${preset}`)}`;
}

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

  it("hands an image's overlay to the stylesheet per mode, as a colour and an opacity fraction", () => {
    expect(backgroundRootStyle(backgroundImage as Background)).toEqual({
      "--bg-overlay-light": "#000000",
      "--bg-overlay-light-opacity": "0.4",
      "--bg-overlay-dark": "#000000",
      "--bg-overlay-dark-opacity": "0.6",
    });
  });

  it("paints the light overlay in dark mode when no dark overlay is configured", () => {
    const background: ImageBackground = {
      ...(backgroundImage as ImageBackground),
      overlay: { light: { color: "#123456", opacity: 25 } },
    };

    expect(backgroundRootStyle(background)).toEqual({
      "--bg-overlay-light": "#123456",
      "--bg-overlay-light-opacity": "0.25",
      "--bg-overlay-dark": "#123456",
      "--bg-overlay-dark-opacity": "0.25",
    });
  });
});

describe("coverImageSizes", () => {
  const image = { width: 2400, height: 1350 };

  it("asks for the larger of the viewport width and the box height times the aspect ratio", () => {
    expect(coverImageSizes([{ height: "100vh" }], image)).toBe(
      "max(100vw, calc(100vh * 2400 / 1350))",
    );
  });

  it("lists one entry per box under its media condition, most specific first", () => {
    expect(
      coverImageSizes(
        [{ media: "(min-width: 768px)", height: "24rem" }, { height: "12rem" }],
        image,
      ),
    ).toBe(
      "(min-width: 768px) max(100vw, calc(24rem * 2400 / 1350)), max(100vw, calc(12rem * 2400 / 1350))",
    );
  });

  it("has no answer when the image has not been measured — the banner context's floor applies", () => {
    expect(coverImageSizes([{ height: "100vh" }], {})).toBeUndefined();
    expect(
      coverImageSizes(
        [{ media: "(min-width: 768px)", height: "24rem" }, { height: "12rem" }],
        { width: 2400 },
      ),
    ).toBeUndefined();
  });
});

describe("imageLayer", () => {
  const boxes = [{ height: "100vh" }];

  it("builds the <img> from the banner presets, with the image's own dimensions and focal point", () => {
    expect(imageLayer(backgroundImage as ImageBackground, boxes)).toEqual({
      src: proxied("lg"),
      srcset: `${proxied("sm")} 480w, ${proxied("md")} 800w, ${proxied("lg")} 1600w`,
      sizes: "max(100vw, calc(100vh * 2400 / 1350))",
      width: 2400,
      height: 1350,
      objectPosition: "50% 35%",
    });
  });

  it("keeps the candidate list and asks for the full viewport width when the image is unmeasured", () => {
    const background: ImageBackground = {
      ...(backgroundImage as ImageBackground),
      image: { source: "media", mediaId: "66f1c2000000000000000003", url: mediaUrl },
    };

    expect(imageLayer(background, boxes)).toEqual({
      src: proxied("lg"),
      srcset: `${proxied("sm")} 480w, ${proxied("md")} 800w, ${proxied("lg")} 1600w`,
      sizes: "100vw",
      width: undefined,
      height: undefined,
      objectPosition: "50% 35%",
    });
  });

  it("renders no image when the reference carries no address", () => {
    const background: ImageBackground = {
      ...(backgroundImage as ImageBackground),
      image: { source: "media", mediaId: "66f1c2000000000000000003" },
    };

    expect(imageLayer(background, boxes)).toBeNull();
  });
});

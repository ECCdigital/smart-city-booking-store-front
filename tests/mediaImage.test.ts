import { describe, expect, it } from "vitest";

import { useMediaImage } from "~/composables/utils/useMediaImage";

const mediaUrl = "/api/v2/instance/media/66f1c2000000000000000001/file";

function proxied(preset: string): string {
  return `/api/img?url=${encodeURIComponent(`${mediaUrl}?size=${preset}`)}`;
}

describe("the logo context", () => {
  it("asks for the small preset alone — a logo is never wider than that, and an SVG is only served rasterised", () => {
    const source = useMediaImage().imageSource({ url: mediaUrl }, "logo");

    expect(source).toEqual({
      src: proxied("sm"),
      srcset: `${proxied("sm")} 480w`,
      sizes: "480px",
    });
  });

  it("answers null for a reference without an address", () => {
    expect(useMediaImage().imageSource(null, "logo")).toBeNull();
    expect(useMediaImage().imageSource({ url: null }, "logo")).toBeNull();
  });
});

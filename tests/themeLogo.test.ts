import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import * as Vue from "vue";
import { compileTemplate, parse } from "vue/compiler-sfc";
import { renderToString } from "vue/server-renderer";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import {
  imageBlockLogo,
  themeLogoImages,
  type ThemeLogoOptions,
} from "~/utils/themeLogo";
import type { HeroImageBlock } from "~~/shared/types/hero";

// The logo and its variant for the dark mode (ECCdigital/tickets#527): with a
// variant both images are in the server-rendered HTML and the class `.dark`
// on <html> picks one, so the right logo stands in the first paint and on
// every toggle without a reload. Each reserves its own box. Without a variant
// the logo is inverted in the dark mode, as before.
//
// Nuxt is not booted (see vitest.config.ts): the component's template is
// compiled and rendered with the state its script derives from the props.

const COMPONENT = fileURLToPath(
  new URL("../app/components/ThemeLogo.vue", import.meta.url),
);

function renderFunction() {
  const { descriptor } = parse(readFileSync(COMPONENT, "utf8"), {
    filename: COMPONENT,
  });
  const { code } = compileTemplate({
    source: descriptor.template!.content,
    filename: COMPONENT,
    id: "ThemeLogo",
    compilerOptions: { mode: "function" },
  });
  return new Function("Vue", code)(Vue);
}

const LOGO = {
  source: "media" as const,
  mediaId: "66f1c2000000000000000009",
  url: "/api/v2/instance/media/66f1c2000000000000000009/file",
  width: 320,
  height: 80,
};

const DARK = {
  source: "media" as const,
  mediaId: "66f1c200000000000000000d",
  url: "/api/v2/instance/media/66f1c200000000000000000d/file",
  width: 200,
  height: 100,
};

/** The images of the logo as the server renders them, given from outside `attrs`. */
async function render(
  props: Partial<ThemeLogoOptions> & { alt?: string },
  attrs: Record<string, unknown> = {},
) {
  const options = { maxHeight: "md", invertInDarkMode: false, ...props } as ThemeLogoOptions;
  const ThemeLogo = {
    inheritAttrs: false,
    render: renderFunction(),
    setup: () => ({
      alt: props.alt ?? "",
      images: themeLogoImages(options),
      mergeProps: Vue.mergeProps,
    }),
  };
  const html = await renderToString(
    Vue.createSSRApp({ render: () => Vue.h(ThemeLogo, attrs) }),
  );
  const { document } = new JSDOM(`<body>${html}</body>`).window;
  return { html, images: [...document.querySelectorAll("img")] };
}

function classesOf(img: Element) {
  return img.getAttribute("class")!.split(/\s+/);
}

describe("the logo with a variant for the dark mode", () => {
  it("renders both images, the logo hidden in the dark mode and the variant shown only there", async () => {
    const { images } = await render({ image: LOGO, imageDark: DARK, alt: "Marktplatz" });

    expect(images).toHaveLength(2);
    const [light, dark] = images;
    expect(light.getAttribute("src")).toContain(
      encodeURIComponent("/api/v2/instance/media/66f1c2000000000000000009/file"),
    );
    expect(dark.getAttribute("src")).toContain(
      encodeURIComponent("/api/v2/instance/media/66f1c200000000000000000d/file"),
    );
    expect(classesOf(light)).toContain("dark:hidden");
    expect(classesOf(dark)).toEqual(expect.arrayContaining(["hidden", "dark:block"]));
    expect(light.getAttribute("alt")).toBe("Marktplatz");
    expect(dark.getAttribute("alt")).toBe("Marktplatz");
  });

  it("reserves each image's box from its own dimensions", async () => {
    const [light, dark] = (await render({ image: LOGO, imageDark: DARK })).images;

    expect([light.getAttribute("width"), light.getAttribute("height")]).toEqual(["320", "80"]);
    expect(light.getAttribute("style")).toBe("height:80px;");
    expect([dark.getAttribute("width"), dark.getAttribute("height")]).toEqual(["200", "100"]);
    expect(dark.getAttribute("style")).toBe("height:100px;");
  });

  it("inverts neither image, even when asked to invert", async () => {
    const { images } = await render({
      image: LOGO,
      imageDark: DARK,
      invertInDarkMode: true,
    });

    for (const img of images) expect(classesOf(img)).not.toContain("dark:invert");
  });

  it("chooses by the class `.dark` alone: no <picture>, no media query", async () => {
    const { html } = await render({ image: LOGO, imageDark: DARK });

    expect(html).not.toContain("<picture");
    expect(html).not.toContain("<source");
    expect(html).not.toContain("prefers-color-scheme");
  });

  it("gives the classes from outside to both images", async () => {
    const { images } = await render(
      { image: LOGO, imageDark: DARK, maxHeight: "lg" },
      { class: "max-sm:h-24 max-sm:max-h-24" },
    );

    for (const img of images) {
      expect(classesOf(img)).toEqual(
        expect.arrayContaining(["max-h-40", "max-sm:h-24", "max-sm:max-h-24"]),
      );
    }
  });
});

describe("the logo without a variant", () => {
  it.each([undefined, null, { ...DARK, url: "" }])(
    "is one image, inverted in the dark mode when asked, for a variant of %s",
    async (imageDark) => {
      const { images } = await render({
        image: LOGO,
        imageDark,
        invertInDarkMode: true,
      });

      expect(images).toHaveLength(1);
      expect(classesOf(images[0])).toEqual(
        expect.arrayContaining(["dark:invert", "dark:hue-rotate-180"]),
      );
      expect(classesOf(images[0])).not.toContain("dark:hidden");
    },
  );

  it("is not inverted unless asked", async () => {
    const { images } = await render({ image: LOGO });

    expect(images).toHaveLength(1);
    expect(classesOf(images[0])).not.toContain("dark:invert");
  });

  it("renders nothing without an address", async () => {
    const { images } = await render({ image: { ...LOGO, url: "" }, imageDark: DARK });

    expect(images).toHaveLength(0);
  });
});

// An image Block of the Hero renders through the same logo (ECCdigital/tickets#528).
// One that follows the app logo takes the app logo's rule: its variant in the
// dark mode, or inverted without one. It has no switch of its own.
describe("an image Block", () => {
  const BLOCK = {
    id: "logo",
    type: "image",
    zone: "middle-right",
    alt: { de: "Marktplatz" },
    maxHeight: "sm",
  } as const;

  function block(fields: object) {
    return { ...BLOCK, ...fields } as unknown as HeroImageBlock;
  }

  const APP_LOGO = {
    source: "app-logo" as const,
    url: LOGO.url,
    width: LOGO.width,
    height: LOGO.height,
  };

  it("following the app logo shows its variant in the dark mode", async () => {
    const options = imageBlockLogo(
      block({
        image: {
          ...APP_LOGO,
          dark: { url: DARK.url, width: DARK.width, height: DARK.height },
        },
      }),
    );
    const { images } = await render({ ...options, maxHeight: "sm" });

    expect(images).toHaveLength(2);
    const [light, dark] = images;
    expect(light.getAttribute("src")).toContain(encodeURIComponent(LOGO.url));
    expect(classesOf(light)).toContain("dark:hidden");
    expect(dark.getAttribute("src")).toContain(encodeURIComponent(DARK.url));
    expect(classesOf(dark)).toEqual(expect.arrayContaining(["hidden", "dark:block"]));
    expect([dark.getAttribute("width"), dark.getAttribute("height")]).toEqual(["200", "100"]);
    for (const img of images) expect(classesOf(img)).not.toContain("dark:invert");
  });

  it("following the app logo without a variant is the app logo, inverted in the dark mode", async () => {
    const { images } = await render({
      ...imageBlockLogo(block({ image: APP_LOGO })),
      maxHeight: "sm",
    });

    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("src")).toContain(encodeURIComponent(LOGO.url));
    expect(classesOf(images[0])).toEqual(
      expect.arrayContaining(["dark:invert", "dark:hue-rotate-180"]),
    );
  });

  it("following the app logo shows nothing when there is none", async () => {
    const { images } = await render({
      ...imageBlockLogo(block({ image: { source: "app-logo" } })),
      maxHeight: "sm",
    });

    expect(images).toHaveLength(0);
  });

  it.each([true, false])(
    "with a medium of its own inverts as its switch says (%s), even a copy of the app logo",
    async (invertInDarkMode) => {
      const { images } = await render({
        ...imageBlockLogo(block({ image: LOGO, invertInDarkMode })),
        maxHeight: "sm",
      });

      expect(images).toHaveLength(1);
      expect(images[0].getAttribute("src")).toContain(encodeURIComponent(LOGO.url));
      expect(classesOf(images[0]).includes("dark:invert")).toBe(invertInDarkMode);
    },
  );
});

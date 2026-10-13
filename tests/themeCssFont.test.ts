import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { renderThemeCss } from "~~/server/utils/themeCss";
import { readThemeFont } from "~~/server/utils/themeFont";
import { buildThemeView, defaultThemeView } from "~~/server/utils/themeView";

/**
 * The instance font in the theme stylesheet (ECCdigital/tickets#531): the
 * font's own faces with `font-display: optional`, fallback faces that give a
 * system font the font's measure, and `--font-sans` naming all of them ahead
 * of today's stack.
 */

const DEFAULTS = { primary: "#FF8B00", secondary: "#1D9ECC" };

const TODAYS_STACK =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

const noFile = async () => null;

async function cssWith(font: unknown, etag: string) {
  return renderThemeCss({
    etag,
    colors: null,
    defaults: DEFAULTS,
    font: await readThemeFont({ font, etag, readFile: noFile }),
  });
}

/** The `@font-face` rules of a stylesheet, each as its declarations. */
function fontFaces(css: string): Record<string, string>[] {
  return [...css.matchAll(/@font-face \{([^}]*)\}/g)].map(([, body]) =>
    Object.fromEntries(
      body!
        .split(";")
        .map((declaration) => declaration.trim())
        .filter(Boolean)
        .map((declaration) => {
          const colon = declaration.indexOf(":");
          return [declaration.slice(0, colon), declaration.slice(colon + 1).trim()];
        }),
    ),
  );
}

describe("renderThemeCss with a font of the curated list", () => {
  it("declares the font's upright and italic faces with font-display optional", async () => {
    const faces = fontFaces(await cssWith({ source: "curated", id: "inter" }, "f-inter"));

    expect(faces.filter((face) => face["font-family"] === '"Theme Font"')).toEqual([
      {
        "font-family": '"Theme Font"',
        src: 'url("/fonts/inter/inter-5.3.0-latin-wght-normal.woff2") format("woff2")',
        "font-weight": "100 900",
        "font-style": "normal",
        "font-display": "optional",
      },
      {
        "font-family": '"Theme Font"',
        src: 'url("/fonts/inter/inter-5.3.0-latin-wght-italic.woff2") format("woff2")',
        "font-weight": "100 900",
        "font-style": "italic",
        "font-display": "optional",
      },
    ]);
  });

  it("gives Arial and Roboto the font's measure from the table", async () => {
    const faces = fontFaces(await cssWith({ source: "curated", id: "inter" }, "f-inter"));

    // Inter at 400 against Arial and Roboto, as measured in the research of
    // ECCdigital/tickets#511.
    expect(faces.filter((face) => face.src?.startsWith("local("))).toEqual([
      {
        "font-family": '"Theme Font Fallback A"',
        src: 'local("Arial")',
        "size-adjust": "107.12%",
        "ascent-override": "90.44%",
        "descent-override": "22.52%",
        "line-gap-override": "0%",
      },
      {
        "font-family": '"Theme Font Fallback R"',
        src: 'local("Roboto")',
        "size-adjust": "107.35%",
        "ascent-override": "90.24%",
        "descent-override": "22.47%",
        "line-gap-override": "0%",
      },
    ]);
  });

  it("names the font and its fallbacks ahead of today's stack", async () => {
    const css = await cssWith({ source: "curated", id: "inter" }, "f-inter");

    expect(css).toContain(
      `:root {\n  --font-sans: "Theme Font", "Theme Font Fallback A", "Theme Font Fallback R", ${TODAYS_STACK};\n}`,
    );
  });
});

describe("renderThemeCss with IBM Plex Sans", () => {
  it("declares IBM's own latin1 files with the full weight axis", async () => {
    const faces = fontFaces(await cssWith({ source: "curated", id: "ibm-plex-sans" }, "f-plex"));

    expect(faces.filter((face) => face["font-family"] === '"Theme Font"')).toEqual([
      expect.objectContaining({
        src: 'url("/fonts/ibm-plex-sans/ibm-plex-sans-0.2.0-latin1-normal.woff2") format("woff2")',
        "font-weight": "100 700",
        "font-style": "normal",
      }),
      expect.objectContaining({
        src: 'url("/fonts/ibm-plex-sans/ibm-plex-sans-0.2.0-latin1-italic.woff2") format("woff2")',
        "font-weight": "100 700",
        "font-style": "italic",
      }),
    ]);
  });

  it("measures the fallbacks at the default instance, which is Regular", async () => {
    const faces = fontFaces(await cssWith({ source: "curated", id: "ibm-plex-sans" }, "f-plex"));

    // Plex at 400 (ascent 1025, descent 275, average width 451 of 1000),
    // the same in IBM's static Regular and at the variable font's default.
    expect(faces.filter((face) => face.src?.startsWith("local("))).toEqual([
      expect.objectContaining({ src: 'local("Arial")', "size-adjust": "101.17%", "ascent-override": "101.32%", "descent-override": "27.18%", "line-gap-override": "0%" }),
      expect.objectContaining({ src: 'local("Roboto")', "size-adjust": "101.39%", "ascent-override": "101.1%", "descent-override": "27.12%", "line-gap-override": "0%" }),
    ]);
  });

  it("ships IBM's files byte for byte, with IBM's licence beside them", () => {
    const sha256 = (path: string) =>
      createHash("sha256").update(readFileSync(new URL(`../public/fonts/ibm-plex-sans/${path}`, import.meta.url))).digest("hex");

    // `fonts/split/woff2/IBM Plex Sans Var-{Roman,Italic}-Latin1.woff2` and
    // `LICENSE.txt` of `@ibm/plex-sans-variable` 0.2.0. Its licence reserves
    // the name "Plex": any change to a file would make it a Modified Version
    // that may no longer carry the name.
    expect(sha256("ibm-plex-sans-0.2.0-latin1-normal.woff2")).toBe("a18d94ea83c93f0a465d0976d8bc8ecbb031225dbaf76fd201d4e724a972034f");
    expect(sha256("ibm-plex-sans-0.2.0-latin1-italic.woff2")).toBe("4dbb53a002b701005c7eb5d0fc049a3abd7c31821714ab5fdc33c189ceadeb75");
    expect(sha256("OFL.txt")).toBe("7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da");
  });
});

describe("renderThemeCss without a font", () => {
  it("writes nothing of a font and the same bytes as before the setting", async () => {
    const before = renderThemeCss({ etag: "f-none-a", colors: null, defaults: DEFAULTS });
    const css = await cssWith(null, "f-none-b");

    expect(css).toBe(before);
    expect(css).not.toContain("@font-face");
    expect(css).not.toContain("--font-sans");
  });

  it("keeps the system font for an id that is not on the list", async () => {
    const css = await cssWith({ source: "curated", id: "comic-sans" }, "f-unknown");

    expect(css).not.toContain("@font-face");
    expect(css).not.toContain("--font-sans");
  });
});

describe("renderThemeCss with the serif of the curated list", () => {
  it("measures the desktop fallback against Times New Roman", async () => {
    const faces = fontFaces(await cssWith({ source: "curated", id: "noto-serif" }, "f-serif"));
    const desktop = faces.find((face) => face["font-family"] === '"Theme Font Fallback A"');

    // Noto Serif against Times New Roman: 118.4 % in the research of
    // ECCdigital/tickets#511.
    expect(desktop).toMatchObject({ src: 'local("Times New Roman")', "size-adjust": "118.4%" });
  });
});

describe("renderThemeCss with a font of the media library", () => {
  const MEDIA_URL = "/api/v2/instance/media/00000000000000000000f0f0/file";
  const upload = { source: "media", reference: { source: "media", mediaId: "00000000000000000000f0f0", url: MEDIA_URL } };
  const variableFile = readFileSync(
    new URL("../public/fonts/inter/inter-5.3.0-latin-wght-normal.woff2", import.meta.url),
  );
  const staticFile = readFileSync(
    new URL("./fixtures/fonts/figtree-5.3.0-latin-400-normal.woff2", import.meta.url),
  );

  async function cssWithFile(file: Buffer | null, etag: string, font: unknown = upload) {
    const asked: string[] = [];
    const css = renderThemeCss({
      etag,
      colors: null,
      defaults: DEFAULTS,
      font: await readThemeFont({
        font,
        etag,
        readFile: async (url) => {
          asked.push(url);
          return file;
        },
      }),
    });
    return { css, asked };
  }

  it("serves the file from the storefront's own route, versioned by the etag", async () => {
    const { css, asked } = await cssWithFile(variableFile, "f-up-1");

    expect(asked).toEqual([MEDIA_URL]);
    expect(fontFaces(css).filter((face) => face["font-family"] === '"Theme Font"')).toEqual([
      {
        "font-family": '"Theme Font"',
        src: 'url("/api/theme/font?v=f-up-1") format("woff2")',
        "font-weight": "100 900",
        "font-style": "normal",
        "font-display": "optional",
      },
    ]);
  });

  it("reads the fallback measure from the file", async () => {
    const { css } = await cssWithFile(variableFile, "f-up-2");

    // The same Inter as the curated one, so the same numbers as its table row.
    expect(fontFaces(css).filter((face) => face.src?.startsWith("local("))).toEqual([
      expect.objectContaining({ src: 'local("Arial")', "size-adjust": "107.12%", "ascent-override": "90.44%", "descent-override": "22.52%" }),
      expect.objectContaining({ src: 'local("Roboto")', "size-adjust": "107.35%" }),
    ]);
    expect(css).toContain('--font-sans: "Theme Font", "Theme Font Fallback A", "Theme Font Fallback R", ui-sans-serif');
  });

  it("declares a file of one weight as 400", async () => {
    const { css } = await cssWithFile(staticFile, "f-up-static");
    const faces = fontFaces(css);

    expect(faces[0]).toMatchObject({ "font-weight": "400" });
    // Figtree at 400 against Arial: 100.7 % in the research of
    // ECCdigital/tickets#511.
    expect(faces[1]).toMatchObject({ src: 'local("Arial")', "size-adjust": "100.72%" });
  });

  it("keeps the system font when the file cannot be read or is no font", async () => {
    const missing = await cssWithFile(null, "f-up-missing");
    const broken = await cssWithFile(Buffer.from("wOF2 but nothing else"), "f-up-broken");

    for (const { css } of [missing, broken]) {
      expect(css).not.toContain("@font-face");
      expect(css).not.toContain("--font-sans");
    }
  });

  it("never fetches a font that is not one of the media library", async () => {
    const foreign = { ...upload, reference: { ...upload.reference, url: "https://fonts.example/a.woff2" } };
    const { css, asked } = await cssWithFile(variableFile, "f-up-foreign", foreign);

    expect(asked).toEqual([]);
    expect(css).not.toContain("@font-face");
  });

  it("renders the font once it loads, after a first try under the same etag failed", async () => {
    await cssWithFile(null, "f-up-retry");
    const { css } = await cssWithFile(variableFile, "f-up-retry");

    expect(css).toContain('url("/api/theme/font?v=f-up-retry")');
  });

  it("keeps an etag that could end the URL inside it", async () => {
    const etag = 'x");}body{color:red}/*\'(';
    const { css } = await cssWithFile(variableFile, etag);
    const src = fontFaces(css)[0]!.src!;

    expect(src).toMatch(/^url\("\/api\/theme\/font\?v=[A-Za-z0-9%._~-]+"\) format\("woff2"\)$/);
    expect(css).not.toContain("body{");
  });
});

describe("the preload of the font", () => {
  const MEDIA_URL = "/api/v2/instance/media/00000000000000000000f0f0/file";
  const variableFile = readFileSync(
    new URL("../public/fonts/inter/inter-5.3.0-latin-wght-normal.woff2", import.meta.url),
  );

  it.each([
    ["curated", { source: "curated", id: "figtree" }],
    ["media", { source: "media", reference: { source: "media", mediaId: "f0f0", url: MEDIA_URL } }],
  ])("names the very URL of the upright face (%s)", async (_, font) => {
    const etag = 'W/"pre(load)"';
    const css = renderThemeCss({
      etag,
      colors: null,
      defaults: DEFAULTS,
      font: await readThemeFont({ font, etag, readFile: async () => variableFile }),
    });
    const upright = fontFaces(css).find((face) => face["font-style"] === "normal")!;

    expect(upright.src).toBe(`url("${buildThemeView({ font }, etag).font?.href}") format("woff2")`);
  });

  it("is absent without a font, and for an id off the list", () => {
    expect(buildThemeView({}, "e").font).toBeNull();
    expect(buildThemeView({ font: null }, "e").font).toBeNull();
    expect(buildThemeView({ font: { source: "curated", id: "comic-sans" } }, "e").font).toBeNull();
    expect(defaultThemeView().font).toBeNull();
  });
});

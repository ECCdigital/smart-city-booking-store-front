// Builds the curated font list of the theme stylesheet (ECCdigital/tickets#531):
// copies each font's latin variable woff2 files into `public/fonts/<id>/`,
// puts its `OFL.txt` beside them and writes the table of its faces and
// fallback metrics to `server/utils/curatedFonts.ts`.
//
// The fallback metrics come from the static weight-400 file, not from the
// variable one: capsize reads a variable font's default instance, which for
// Figtree is Light and for Public Sans Thin, and the fallback would then be
// too narrow for the regular text it stands in for.
//
// Run by hand, with network, when a font joins the list or moves to a new
// version: `node scripts/curated-fonts.mjs`. Nothing of it runs at build or at
// run time. A new font also needs its id in the backend and the admin UI.
//
// Sources:
// - the font files: Fontsource on npm, `@fontsource-variable/<id>` (latin,
//   `wght` axis, upright and italic) and `@fontsource/<id>` (latin 400);
// - the licence: `ofl/<dir>/OFL.txt` of github.com/google/fonts at a fixed
//   commit. A font whose licence reserves a font name is refused: a latin
//   subset is a Modified Version under the OFL and may not carry it.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fromBuffer } from "@capsizecss/unpack";
import { create } from "fontkitten";
import { fallbackFaces } from "../server/utils/fontFallback.ts";

const FONTSOURCE_VERSION = "5.3.0";
const GOOGLE_FONTS_COMMIT = "66928797f271fed5ee428544e7229685e2d90127";

// The ids are the backend's (`CURATED_FONT_IDS`). `ibm-plex-sans` is on the
// backend's list but not here: its licence reserves the name "Plex".
const FONTS = [
  { id: "inter", ofl: "inter" },
  { id: "open-sans", ofl: "opensans" },
  { id: "roboto", ofl: "roboto" },
  { id: "noto-sans", ofl: "notosans" },
  { id: "public-sans", ofl: "publicsans" },
  { id: "atkinson-hyperlegible-next", ofl: "atkinsonhyperlegiblenext" },
  { id: "figtree", ofl: "figtree" },
  { id: "noto-serif", ofl: "notoserif", serif: true },
];

const root = new URL("..", import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), "curated-fonts-"));

/** Unpacks an npm package into its own directory and answers its `files/`. */
function unpack(name) {
  const dir = mkdtempSync(join(work, "pkg-"));
  const tarball = execFileSync("npm", ["pack", "--silent", `${name}@${FONTSOURCE_VERSION}`], {
    cwd: dir,
    encoding: "utf8",
  }).trim();
  execFileSync("tar", ["-xzf", tarball], { cwd: dir });
  return join(dir, "package", "files");
}

function weightAxis(bytes) {
  const wght = create(bytes).variationAxes?.wght;
  if (!wght) throw new Error("no wght axis");
  return [wght.min, wght.max];
}

async function licence({ id, ofl }) {
  const url = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/ofl/${ofl}/OFL.txt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${id}: ${url} answered ${response.status}`);
  const text = await response.text();
  if (/with Reserved Font Names?\s+"/i.test(text)) {
    throw new Error(`${id}: the licence reserves a font name`);
  }
  return text;
}

const table = {};

try {
  for (const font of FONTS) {
    const variable = unpack(`@fontsource-variable/${font.id}`);
    const fixed = unpack(`@fontsource/${font.id}`);
    const target = join(root, "public", "fonts", font.id);
    mkdirSync(target, { recursive: true });

    const faces = [];
    for (const style of ["normal", "italic"]) {
      const source = join(variable, `${font.id}-latin-wght-${style}.woff2`);
      const name = `${font.id}-${FONTSOURCE_VERSION}-latin-wght-${style}.woff2`;
      copyFileSync(source, join(target, name));
      faces.push({
        src: `/fonts/${font.id}/${name}`,
        style,
        weight: weightAxis(readFileSync(source)),
      });
    }

    writeFileSync(join(target, "OFL.txt"), await licence(font));

    const metrics = await fromBuffer(
      readFileSync(join(fixed, `${font.id}-latin-400-normal.woff2`)),
    );
    table[font.id] = { faces, fallbacks: fallbackFaces(metrics, font.serif) };
    console.log(`${font.id}: ${faces.map((f) => f.weight.join("-")).join(", ")}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

// One line per face, so a new version reads as a short diff.
const line = (value) => {
  if (Array.isArray(value)) return `[${value.map(line).join(", ")}]`;
  if (value && typeof value === "object") {
    return `{ ${Object.entries(value).map(([key, item]) => `${key}: ${line(item)}`).join(", ")} }`;
  }
  return JSON.stringify(value);
};
const entries = Object.entries(table).map(
  ([id, { faces, fallbacks }]) => `  "${id}": {
    faces: [
${faces.map((face) => `      ${line(face)},`).join("\n")}
    ],
    fallbacks: [
${fallbacks.map((face) => `      ${line(face)},`).join("\n")}
    ],
  },`,
);

writeFileSync(
  join(root, "server", "utils", "curatedFonts.ts"),
  `// Generated by \`node scripts/curated-fonts.mjs\` from Fontsource ${FONTSOURCE_VERSION}
// and google/fonts ${GOOGLE_FONTS_COMMIT.slice(0, 12)}. Do not edit by hand.
import type { CuratedFont } from "./themeFont";

export const CURATED_FONTS: Readonly<Record<string, CuratedFont>> = {
${entries.join("\n")}
};
`,
);

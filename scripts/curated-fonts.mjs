// Builds the curated font list of the theme stylesheet (ECCdigital/tickets#531):
// copies each font's latin variable woff2 files into `public/fonts/<id>/`,
// puts its licence beside them as `OFL.txt` and writes the table of its faces
// and fallback metrics to `server/utils/curatedFonts.ts`.
//
// The fallback metrics come from the weight-400 instance. For a Fontsource
// font that is its static 400 file, not the variable one: capsize reads a
// variable font's default instance, which for Figtree is Light and for Public
// Sans Thin, and the fallback would then be too narrow for the regular text it
// stands in for. A font from its copyright holder has no static file beside
// it; its variable file is read only after checking that its default instance
// is 400.
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
//   subset is a Modified Version under the OFL and may not carry it;
// - the exception, `FROM_HOLDER`: a font whose copyright holder publishes
//   the subset files itself, files and licence from the holder's npm package.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fromBuffer } from "@capsizecss/unpack";
import { create } from "fontkitten";
import { fallbackFaces } from "../server/utils/fontFallback.ts";

const FONTSOURCE_VERSION = "5.3.0";
const GOOGLE_FONTS_COMMIT = "66928797f271fed5ee428544e7229685e2d90127";

// The ids are the backend's (`CURATED_FONT_IDS`), in its order.
const FONTS = [
  { id: "inter", ofl: "inter" },
  { id: "open-sans", ofl: "opensans" },
  { id: "roboto", ofl: "roboto" },
  { id: "noto-sans", ofl: "notosans" },
  { id: "public-sans", ofl: "publicsans" },
  { id: "atkinson-hyperlegible-next", ofl: "atkinsonhyperlegiblenext" },
  { id: "ibm-plex-sans" },
  { id: "figtree", ofl: "figtree" },
  { id: "noto-serif", ofl: "notoserif", serif: true },
];

// The one exception to refusing a reserved font name. IBM Plex Sans is
// licensed under the OFL with the Reserved Font Name "Plex", so the latin
// subset Fontsource cuts is a Modified Version and may not be called Plex.
// IBM, the copyright holder, publishes its own subsets in
// `@ibm/plex-sans-variable`. Those files are copied byte for byte and only
// renamed, never subset or converted, so what the storefront serves stays the
// Original Version and keeps its name. Its licence must name exactly the
// reserved name below; any other reservation is refused as for every font.
const FROM_HOLDER = {
  "ibm-plex-sans": {
    package: "@ibm/plex-sans-variable",
    version: "0.2.0",
    // IBM's subset "Latin1": basic latin, Latin-1 Supplement and the
    // punctuation of `IBM Plex Sans Var-Roman.css`, which covers German.
    subset: "latin1",
    files: {
      normal: "fonts/split/woff2/IBM Plex Sans Var-Roman-Latin1.woff2",
      italic: "fonts/split/woff2/IBM Plex Sans Var-Italic-Latin1.woff2",
    },
    licence: "LICENSE.txt",
    reservedName: "Plex",
  },
};

const root = new URL("..", import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), "curated-fonts-"));

/** Unpacks an npm package into its own directory and answers its root. */
function unpack(name, version) {
  const dir = mkdtempSync(join(work, "pkg-"));
  const tarball = execFileSync("npm", ["pack", "--silent", `${name}@${version}`], {
    cwd: dir,
    encoding: "utf8",
  }).trim();
  execFileSync("tar", ["-xzf", tarball], { cwd: dir });
  return join(dir, "package");
}

function weightAxis(bytes) {
  const wght = create(bytes).variationAxes?.wght;
  if (!wght) throw new Error("no wght axis");
  return [wght.min, wght.max];
}

const RESERVED_NAME = /with Reserved Font Names?\s+"([^"]*)"/i;

async function licence({ id, ofl }) {
  const url = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/ofl/${ofl}/OFL.txt`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${id}: ${url} answered ${response.status}`);
  const text = await response.text();
  if (RESERVED_NAME.test(text)) {
    throw new Error(`${id}: the licence reserves a font name`);
  }
  return text;
}

/**
 * Copies a font of `FROM_HOLDER` unchanged: its files under new names, its
 * licence as it is.
 */
function fromHolder(id, holder, target) {
  const pkg = unpack(holder.package, holder.version);

  const text = readFileSync(join(pkg, holder.licence), "utf8");
  if (text.match(RESERVED_NAME)?.[1] !== holder.reservedName) {
    throw new Error(`${id}: the licence does not reserve exactly "${holder.reservedName}"`);
  }
  // The bytes, not the file: the package ships it executable.
  writeFileSync(join(target, "OFL.txt"), readFileSync(join(pkg, holder.licence)));

  const faces = [];
  for (const style of ["normal", "italic"]) {
    const source = join(pkg, holder.files[style]);
    const name = `${id}-${holder.version}-${holder.subset}-${style}.woff2`;
    copyFileSync(source, join(target, name));
    faces.push({ src: `/fonts/${id}/${name}`, style, weight: weightAxis(readFileSync(source)) });
  }

  // No static 400 beside it: measure the upright file, whose default
  // instance has to be the regular weight.
  const upright = readFileSync(join(pkg, holder.files.normal));
  const axes = create(upright).variationAxes;
  if (axes.wght?.default !== 400 || (axes.wdth && axes.wdth.default !== 100)) {
    throw new Error(`${id}: the default instance is not Regular`);
  }
  return { faces, metrics: upright };
}

const table = {};

try {
  for (const font of FONTS) {
    const target = join(root, "public", "fonts", font.id);
    mkdirSync(target, { recursive: true });

    const holder = FROM_HOLDER[font.id];
    if (holder) {
      const { faces, metrics } = fromHolder(font.id, holder, target);
      table[font.id] = { faces, fallbacks: fallbackFaces(await fromBuffer(metrics), font.serif) };
      console.log(`${font.id}: ${faces.map((f) => f.weight.join("-")).join(", ")}`);
      continue;
    }

    const variable = join(unpack(`@fontsource-variable/${font.id}`, FONTSOURCE_VERSION), "files");
    const fixed = join(unpack(`@fontsource/${font.id}`, FONTSOURCE_VERSION), "files");

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
  `// Generated by \`node scripts/curated-fonts.mjs\` from Fontsource ${FONTSOURCE_VERSION},
// google/fonts ${GOOGLE_FONTS_COMMIT.slice(0, 12)}${Object.values(FROM_HOLDER).map((h) => `, ${h.package} ${h.version}`).join("")}.
// Do not edit by hand.
import type { CuratedFont } from "./themeFont";

export const CURATED_FONTS: Readonly<Record<string, CuratedFont>> = {
${entries.join("\n")}
};
`,
);

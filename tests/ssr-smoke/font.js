// The instance font in the server render (ECCdigital/tickets#531). Runs after
// the pages, on the same server: it swaps the `font` of the stand-in's Theme
// Bundle and asks for the home page again. The store revalidates on every
// request in the smoke test (`NUXT_CACHE_ENABLED=false`), so each swap is the
// bundle of the next render.
//
// With a font, the head preloads its file, the file answers as `font/woff2`
// with a lasting cache, and the stylesheet names the very same URL with
// `font-display: optional`. Without one there is no font preload.
import { readFileSync } from "node:fs";

const THEMES = "/api/catalog/themes";
const MEDIA_ID = "00000000000000000000f0f1";
const FONT_MEDIA_PATH = `/api/v2/instance/media/${MEDIA_ID}/file`;

/** The uploaded font the stand-in serves from its media library. */
export const fontRoutes = {
  [FONT_MEDIA_PATH]: readFileSync(
    new URL("../../public/fonts/inter/inter-5.3.0-latin-wght-normal.woff2", import.meta.url),
  ),
};

const variants = [
  {
    name: "media library",
    font: {
      source: "media",
      reference: { source: "media", mediaId: MEDIA_ID, url: FONT_MEDIA_PATH, name: "Smoke-Schrift", size: 48256 },
    },
  },
  { name: "curated list", font: { source: "curated", id: "figtree" } },
  { name: "system font", font: null },
];

/** The `<link>` tags of the document head that preload a font. */
function fontPreloads(html) {
  const head = html.slice(0, html.indexOf("</head>"));
  return [...head.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /\brel="preload"/.test(tag) && /\bas="font"/.test(tag));
}

const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

async function problemsWith({ name, font }, base) {
  const html = await (await fetch(`${base}/`)).text();
  const preloads = fontPreloads(html);

  if (font === null) {
    return preloads.length ? [`${name}: a font preload without a font`] : [];
  }
  if (preloads.length !== 1) return [`${name}: ${preloads.length} font preloads, not 1`];

  const [tag] = preloads;
  const href = attribute(tag, "href");
  const problems = [];
  if (attribute(tag, "type") !== "font/woff2") problems.push(`${name}: preload without type="font/woff2"`);
  if (!/\bcrossorigin\b/.test(tag)) problems.push(`${name}: preload without crossorigin`);

  const file = await fetch(base + href);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.status !== 200) problems.push(`${name}: ${href} answered ${file.status}`);
  if (!file.headers.get("content-type")?.startsWith("font/woff2")) {
    problems.push(`${name}: ${href} is ${file.headers.get("content-type")}, not font/woff2`);
  }
  if (bytes.subarray(0, 4).toString("latin1") !== "wOF2") problems.push(`${name}: ${href} is no woff2`);
  if (!file.headers.get("cache-control")?.includes("immutable")) {
    problems.push(`${name}: ${href} is cached as "${file.headers.get("cache-control")}"`);
  }

  const stylesheet = html.match(/<link\b[^>]*href="(\/api\/theme\/css[^"]*)"/)?.[1];
  const css = stylesheet ? await (await fetch(base + stylesheet)).text() : "";
  if (!css.includes(`url("${href}")`) || !css.includes("font-display: optional")) {
    problems.push(`${name}: the stylesheet does not declare ${href} with font-display: optional`);
  }

  return problems;
}

/**
 * Checks the font in each of its three states.
 *
 * @param {string} base - The storefront under test.
 * @param {{ routes: Record<string, unknown> }} backend - The stand-in, whose
 *   Theme Bundle is swapped and put back.
 * @returns {Promise<string[]>} What is wrong, empty when nothing is.
 */
export async function fontProblems(base, backend) {
  const themes = backend.routes[THEMES];
  const problems = [];
  try {
    for (const variant of variants) {
      backend.routes[THEMES] = { ...themes, font: variant.font };
      const found = await problemsWith(variant, base);
      console.log(`${found.length ? "FAIL" : "ok  "} font: ${variant.name}`);
      problems.push(...found);
    }
  } finally {
    backend.routes[THEMES] = themes;
  }
  return problems;
}

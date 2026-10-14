/**
 * The instance font (ECCdigital/tickets#531): what the Theme Bundle's `font`
 * becomes in the theme stylesheet and in the preload of the document head.
 *
 * The bundle names one of the curated list by id, or a font of the instance's
 * media library by reference. Either way the storefront serves the file from
 * its own origin — the curated ones from `public/fonts/`, an uploaded one
 * through `/api/theme/font` — so no request ever goes to a third party and
 * neither CORS nor the CSP have to change.
 *
 * Nothing of the bundle reaches the CSS as written: the family names are
 * fixed, the curated id only selects a row of the table, and every URL is
 * built here.
 */

import { fromBuffer } from "@capsizecss/unpack";
import { create } from "fontkitten";
import { isMediaFileUrl } from "~~/shared/utils/mediaUrl";
import { CURATED_FONTS } from "./curatedFonts";
import { fallbackFaces, type FallbackFace } from "./fontFallback";

/** One `@font-face` of the font itself. */
export interface ThemeFontFace {
  /** Absolute path on the storefront's origin. */
  src: string;
  style: "normal" | "italic";
  /** The range of the `wght` axis, or `null` for a file of one weight. */
  weight: readonly [number, number] | null;
}

/** A row of the curated table. */
export interface CuratedFont {
  faces: readonly ThemeFontFace[];
  fallbacks: readonly FallbackFace[];
}

/** Everything the theme stylesheet writes for a font. */
export interface ThemeFont extends CuratedFont {
  /** The file the document head preloads: the upright face. */
  href: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function curatedFont(font: Record<string, unknown>): CuratedFont | null {
  const id = font.id;
  return typeof id === "string" && Object.hasOwn(CURATED_FONTS, id)
    ? CURATED_FONTS[id]!
    : null;
}

/**
 * The URL of an uploaded font in the backend, when the bundle names one of
 * the media library. Anything else — a foreign address included — is not a
 * font the storefront serves.
 */
export function themeFontFileUrl(font: unknown): string | null {
  if (!isPlainObject(font) || font.source !== "media") return null;
  const reference = font.reference;
  if (!isPlainObject(reference)) return null;
  const url = reference.url;
  return typeof url === "string" && isMediaFileUrl(url) ? url : null;
}

/**
 * The storefront's URL of an uploaded font. The etag versions it like every
 * other theme asset, so it is cached for good and a new font is a new URL.
 * Beyond `encodeURIComponent`, the characters it leaves alone that CSS or a
 * URL would read — `!'()*` — are escaped too.
 */
function uploadedFontHref(etag: string): string {
  const version = encodeURIComponent(etag).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `/api/theme/font?v=${version}`;
}

const clampWeight = (value: number): number =>
  Math.min(1000, Math.max(1, Math.round(value)));

/**
 * Reads what the stylesheet needs from an uploaded woff2: the metrics of its
 * default instance for the fallbacks, and the range of its `wght` axis. A
 * variable font whose default instance is not 400 gets fallbacks that fit
 * less well; the admin UI says so when the file is chosen.
 *
 * @returns The faces and fallbacks, or `null` when the bytes are no woff2
 *   font capsize can read.
 */
async function uploadedFont(bytes: Buffer, href: string): Promise<CuratedFont | null> {
  if (bytes.subarray(0, 4).toString("latin1") !== "wOF2") return null;

  try {
    const metrics = await fromBuffer(bytes);
    const fallbacks = fallbackFaces(metrics);
    if (fallbacks.length === 0) return null;

    const parsed = create(bytes);
    const wght = parsed.isCollection ? undefined : parsed.variationAxes.wght;
    const weight: [number, number] | null = wght
      ? [clampWeight(wght.min), clampWeight(wght.max)]
      : null;

    return { faces: [{ src: href, style: "normal", weight }], fallbacks };
  } catch {
    return null;
  }
}

/**
 * What the document head preloads for the font of a Theme Bundle: the URL of
 * its upright face, the same string the stylesheet's `@font-face` names, or
 * the browser would fetch the file twice. Without a preload a font with
 * `font-display: optional` would never make the first paint.
 *
 * @param font - The bundle's `font`, untrusted.
 * @param etag - The bundle's etag.
 * @returns The URL, or `null` for the system font.
 */
export function themeFontHref(font: unknown, etag: string): string | null {
  if (!isPlainObject(font)) return null;
  if (font.source === "curated") return curatedFont(font)?.faces[0]?.src ?? null;
  return themeFontFileUrl(font) ? uploadedFontHref(etag) : null;
}

/**
 * The font of a Theme Bundle, ready for the stylesheet.
 *
 * @param input.font - The bundle's `font`, untrusted.
 * @param input.etag - The bundle's etag, which versions an uploaded font's URL.
 * @param input.readFile - Reads an uploaded font's bytes by its reference URL.
 * @returns The font, or `null` for the system font — also when the font
 *   cannot be served.
 */
export async function readThemeFont(input: {
  font: unknown;
  etag: string;
  readFile: (url: string) => Promise<Buffer | null>;
}): Promise<ThemeFont | null> {
  const { font } = input;
  if (!isPlainObject(font)) return null;

  if (font.source === "curated") {
    const curated = curatedFont(font);
    return curated ? { ...curated, href: curated.faces[0]!.src } : null;
  }

  const url = themeFontFileUrl(font);
  if (!url) return null;

  const bytes = await input.readFile(url);
  if (!bytes) return null;

  const href = uploadedFontHref(input.etag);
  const uploaded = await uploadedFont(bytes, href);
  return uploaded ? { ...uploaded, href } : null;
}

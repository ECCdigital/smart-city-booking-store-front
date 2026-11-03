import { logger } from "~~/server/api/utils/logger.js";
import { createEtagMemo } from "./etagMemo";
import type { ThemeBundleEntry } from "./themeBundleStore";
import { readThemeFont, themeFontFileUrl, type ThemeFont } from "./themeFont";

/**
 * The instance font of a Theme Bundle, read once per etag and shared by the
 * stylesheet, which needs its faces, and by `/api/theme/font`, which serves
 * an uploaded font's bytes (ECCdigital/tickets#531).
 *
 * An uploaded font lives in the backend's media library. It is fetched like
 * the favicon: from the configured backend only, once per Theme Bundle, and a
 * failed fetch is not remembered, so the next request tries again rather
 * than the system font standing for the lifetime of the bundle.
 */

export interface LoadedThemeFont {
  /** The font for the stylesheet, or `null` for the system font. */
  font: ThemeFont | null;
  /** An uploaded font's file; `null` for a curated font or none. */
  bytes: Buffer | null;
}

/** The backend refuses fonts over 500 KB; this only bounds a broken answer. */
const MAX_BYTES = 2 * 1024 * 1024;

/** The stylesheet blocks rendering while it waits, so the wait is short. */
const TIMEOUT_MS = 3000;

const loaded = createEtagMemo<LoadedThemeFont>(8);
const inflight = new Map<string, Promise<LoadedThemeFont | null>>();

async function fetchFontFile(url: string): Promise<Buffer> {
  const { apiBaseUrl } = useRuntimeConfig();
  if (!apiBaseUrl) throw new Error("the backend base URL is not configured");

  // The reference is relative to the backend; an absolute one has to be the
  // backend's own, nothing else is ever asked.
  const target = new URL(url, apiBaseUrl);
  if (target.origin !== new URL(apiBaseUrl).origin) {
    throw new Error(`${target.origin} is not the backend`);
  }

  const response = await fetch(target, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`the backend answered ${response.status}`);
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    throw new Error("the file is too large");
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error("the file is too large");
  return bytes;
}

async function load(entry: ThemeBundleEntry | null, etag: string): Promise<LoadedThemeFont | null> {
  const log = logger.child({ caller: "server/utils/themeFontFile" });
  const bundleFont = entry?.bundle?.font ?? null;

  let bytes: Buffer | null = null;
  let unreachable = false;

  const font = await readThemeFont({
    font: bundleFont,
    etag,
    readFile: async (url) => {
      try {
        bytes = await fetchFontFile(url);
      } catch (error) {
        unreachable = true;
        log.warn(`Could not load the instance font: ${error}`);
      }
      return bytes;
    },
  });

  if (unreachable) return null;
  if (!font && themeFontFileUrl(bundleFont)) {
    // The file is there but no woff2 font capsize can read. That does not
    // change under this etag, so it is remembered like a success.
    log.warn("The instance font is no readable woff2 file; keeping the system font");
  }

  return loaded.set(etag, { font, bytes: font ? bytes : null });
}

/**
 * The instance font of a Theme Bundle entry.
 *
 * @param entry - The entry as `getThemeEntry` answers it.
 * @returns The font and, for an uploaded one, its bytes — or `null` when the
 *   bundle names an uploaded font that could not be fetched this time.
 */
export function loadThemeFont(entry: ThemeBundleEntry | null): Promise<LoadedThemeFont | null> {
  const etag = entry?.etag ?? "default";

  const memoised = loaded.get(etag);
  if (memoised) return Promise.resolve(memoised);

  let pending = inflight.get(etag);
  if (!pending) {
    pending = load(entry, etag).finally(() => inflight.delete(etag));
    inflight.set(etag, pending);
  }
  return pending;
}

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "~~/server/api/utils/logger.js";
import { getThemeEntry } from "~~/server/api/utils/themeBundle";
import { createEtagMemo } from "~~/server/utils/etagMemo";
import { serveVersionedAsset } from "~~/server/utils/versionedAsset";

/**
 * The instance favicon.
 *
 * Like the stylesheet routes it no longer sits behind the shared conditional
 * cache: that cache writes a `Cache-Control` of its own after the handler has
 * run, which would undo the immutable lifetime a versioned request has earned.
 * The bytes are memoised per etag instead, so the upstream favicon is fetched
 * once per Theme Bundle rather than once per request.
 */
interface Favicon {
  body: Buffer;
  contentType: string;
}

const byEtag = createEtagMemo<Favicon>(8);

/** The favicon shipped with the storefront, used when the instance has none. */
async function bundledFavicon(): Promise<Favicon> {
  const path = [
    join(process.cwd(), "public", "favicon.ico"),
    join(process.cwd(), ".output", "public", "favicon.ico"),
  ].find((candidate) => existsSync(candidate));

  if (!path) {
    throw createError({ statusCode: 404, statusMessage: "Favicon not found" });
  }

  return { body: await readFile(path), contentType: "image/x-icon" };
}

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/favicon.get" });

  const entry = await getThemeEntry(event);
  const etag = entry?.etag ?? "default";

  if (serveVersionedAsset(event, entry?.etag ?? null)) return null;

  const memoised = byEtag.get(etag);
  if (memoised) {
    setHeader(event, "Content-Type", memoised.contentType);
    return memoised.body;
  }

  const faviconUrl = entry?.bundle?.faviconUrl ?? null;

  if (faviconUrl) {
    try {
      const response = await fetch(faviconUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const favicon = byEtag.set(etag, {
        body: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get("content-type") ?? "image/x-icon",
      });

      setHeader(event, "Content-Type", favicon.contentType);
      return favicon.body;
    } catch (error) {
      // Deliberately not memoised: a favicon the instance has configured but
      // that failed to load once must be retried, not replaced by the bundled
      // one for the lifetime of this Theme Bundle.
      log.warn(`Could not load remote favicon: ${error}`);
      const fallback = await bundledFavicon();
      setHeader(event, "Content-Type", fallback.contentType);
      return fallback.body;
    }
  }

  const favicon = byEtag.set(etag, await bundledFavicon());
  setHeader(event, "Content-Type", favicon.contentType);
  return favicon.body;
});

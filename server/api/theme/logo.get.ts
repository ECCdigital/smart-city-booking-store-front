import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { apiFetch } from "~~/server/api/utils/apiFetch.js";
import { logger } from "~~/server/api/utils/logger.js";

const logoCache: {
  data: Buffer | null;
  contentType: string;
  fetchedAt: number;
} = {
  data: null,
  contentType: "image/png",
  fetchedAt: 0,
};

const CACHE_TTL = 5 * 60 * 1000;

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/logo.get" });
  const now = Date.now();

  if (logoCache.data && now - logoCache.fetchedAt < CACHE_TTL) {
    console.log("Serving logo from cache");
    setHeader(event, "Content-Type", logoCache.contentType);
    setHeader(event, "Cache-Control", "public, max-age=300");
    return logoCache.data;
  }

  console.log("Fetching new logo");

  let logoUrl = null;

  try {
    const fetchedThemeBundle = await apiFetch(event, `/api/catalog/themes`, {
      method: "GET",
    });
    logoUrl = fetchedThemeBundle?.logoUrl ?? null;
  } catch (error) {
    log.error(`Error fetching theme: ${error}`);
  }

  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType =
          response.headers.get("content-type") ?? "image/png";

      logoCache.data = buffer;
      logoCache.contentType = contentType;
      logoCache.fetchedAt = now;

      setHeader(event, "Content-Type", contentType);
      setHeader(event, "Cache-Control", "public, max-age=300");
      return buffer;
    } catch (error) {
      log.warn(`Could not load remote logo: ${error}`);
    }
  }

  const candidates = [
    join(process.cwd(), "public", "app-logo.png"),
    join(process.cwd(), ".output", "public", "app-logo.png"),
  ];

  const defaultLogoPath = candidates.find((p) => existsSync(p));

  if (!defaultLogoPath) {
    throw createError({ statusCode: 404, statusMessage: "Logo not found" });
  }

  setHeader(event, "Content-Type", "image/png");
  setHeader(event, "Cache-Control", "public, max-age=300");
  return sendStream(event, createReadStream(defaultLogoPath));
});
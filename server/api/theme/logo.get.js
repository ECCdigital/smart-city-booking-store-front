import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { apiFetch } from "~~/server/api/utils/apiFetch.js";
import { logger } from "~~/server/api/utils/logger.js";

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/logo.get" });

  let logoUrl = null;

  try {
    const fetchedThemeBundle = await apiFetch(event, `/api/catalog/themes`, {
      method: "GET",
    });

    logoUrl = fetchedThemeBundle?.logoUrl;
  } catch (error) {
    log.error(`Error fetching theme: ${error}`);
  }

  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);

      if (!response.ok || !response.body) {
        throw new Error(
          `Failed to fetch logoUrl: ${response.status} ${response.statusText}`
        );
      }

      const contentType =
        response.headers.get("content-type") ?? "application/octet-stream";

      setHeader(event, "Content-Type", contentType);
      setHeader(event, "Cache-Control", "public, max-age=300");

      return sendStream(event, Readable.fromWeb(response.body));
    } catch (error) {
      log.warn(`Could not load remote logo (${logoUrl}), fallback: ${error}`);
    }
  }

  const defaultLogoPath = join(process.cwd(), "public", "app-logo.png");

  if (!existsSync(defaultLogoPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: "Default logo not found: /public/app-logo.png",
    });
  }

  setHeader(event, "Content-Type", "image/png");
  setHeader(event, "Cache-Control", "public, max-age=300");

  return sendStream(event, createReadStream(defaultLogoPath));
});

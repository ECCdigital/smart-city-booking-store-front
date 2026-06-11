import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "~~/server/api/utils/logger.js";
import { getThemeBundle } from "~~/server/api/utils/themeBundle";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

export default createConditionalCachedHandler(
  async (event) => {
    const log = logger.child({ caller: "server/api/theme/favicon.get" });

    const bundle = await getThemeBundle(event);
    const faviconUrl = bundle?.faviconUrl ?? null;

    if (faviconUrl) {
      try {
        const response = await fetch(faviconUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType =
          response.headers.get("content-type") ?? "image/x-icon";

        setHeader(event, "Content-Type", contentType);
        setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
        return buffer;
      } catch (error) {
        log.warn(`Could not load remote favicon: ${error}`);
      }
    }

    const candidates = [
      join(process.cwd(), "public", "favicon.ico"),
      join(process.cwd(), ".output", "public", "favicon.ico"),
    ];

    const defaultFaviconPath = candidates.find((p) => existsSync(p));

    if (!defaultFaviconPath) {
      throw createError({ statusCode: 404, statusMessage: "Favicon not found" });
    }

    setHeader(event, "Content-Type", "image/x-icon");
    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
    return sendStream(event, createReadStream(defaultFaviconPath));
  },
  { maxAge: 300, authScoped: false }
);

import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { logger } from "~~/server/api/utils/logger.js";
import { getThemeBundle } from "~~/server/api/utils/themeBundle";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

export default createConditionalCachedHandler(
  async (event) => {
    const log = logger.child({ caller: "server/api/theme/logo.get" });

    const bundle = await getThemeBundle(event);
    const logoUrl = bundle?.logoUrl ?? null;

    if (logoUrl) {
      try {
        const response = await fetch(logoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") ?? "image/png";

        setHeader(event, "Content-Type", contentType);
        setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
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
    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");
    return sendStream(event, createReadStream(defaultLogoPath));
  },
  { maxAge: 300, authScoped: false }
);

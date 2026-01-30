import { serverFetch } from "~~/server/api/utils/serverFetch.js";
import { logger } from "~~/server/api/utils/logger.js";
import type { ThemeBundle } from "~~/shared/types/api.js";

const DEFAULT_HERO = {
  title: "Marktplatz",
  subtitle: "Entdecken Sie unsere Angebote",
};

export default createConditionalCachedHandler(
  async (event) => {
    const log = logger.child({ caller: "server/api/theme/hero.get" });

    try {
      const bundle = await serverFetch(event, `/api/catalog/themes`, {
        method: "GET",
      }) as ThemeBundle;

      return {
        title: bundle?.hero?.title || DEFAULT_HERO.title,
        subtitle: bundle?.hero?.subtitle || DEFAULT_HERO.subtitle,
      };
    } catch (error) {
      log.error(`Error fetching hero config: ${error}`);
      return DEFAULT_HERO;
    }
  },
  { maxAge: 300 }
);

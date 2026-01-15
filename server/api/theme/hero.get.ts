import { apiFetch } from "~~/server/api/utils/apiFetch.js";
import { logger } from "~~/server/api/utils/logger.js";

const heroCache: {
  data: { title: string; subtitle: string } | null;
  fetchedAt: number;
} = {
  data: null,
  fetchedAt: 0,
};

const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT_HERO = {
  title: "Marktplatz",
  subtitle: "Entdecken Sie unsere Angebote",
};

export default defineEventHandler(async (event) => {
  const log = logger.child({ caller: "server/api/theme/hero.get" });
  const now = Date.now();

  if (heroCache.data && now - heroCache.fetchedAt < CACHE_TTL) {
    return heroCache.data;
  }


  try {
    const fetchedThemeBundle = await apiFetch(event, `/api/catalog/themes`, {
      method: "GET",
    });


    const heroData = {
      title: fetchedThemeBundle?.hero.title || DEFAULT_HERO.title,
      subtitle: fetchedThemeBundle?.hero.subtitle || DEFAULT_HERO.subtitle,
    };


    heroCache.data = heroData;
    heroCache.fetchedAt = now;

    return heroData;
  } catch (error) {
    log.error(`Error fetching hero config: ${error}`);
    return DEFAULT_HERO;
  }
});

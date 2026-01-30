import { serverFetch } from "~~/server/api/utils/serverFetch.js";
import type { ThemeBundle } from "~~/shared/types/api.js";

const DEFAULT_HERO = {
  title: "Marktplatz",
  subtitle: "Entdecken Sie unsere Angebote",
};

export default createConditionalCachedHandler(
  async (event) => {
    const { data, error } = await serverFetch<ThemeBundle>(
      event,
      `/api/catalog/themes`,
      {
        method: "GET",
      }
    );

    if (error) {
      return DEFAULT_HERO;
    }

    return {
      title: data?.hero?.title || DEFAULT_HERO.title,
      subtitle: data?.hero?.subtitle || DEFAULT_HERO.subtitle,
    };
  },
  { maxAge: 300 }
);

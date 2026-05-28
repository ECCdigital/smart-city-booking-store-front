import { getThemeBundle } from "~~/server/api/utils/themeBundle";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

const DEFAULT_HERO = {
  title: "Marktplatz",
  subtitle: "Entdecken Sie unsere Angebote",
};

export default createConditionalCachedHandler(
  async (event) => {
    const bundle = await getThemeBundle(event);
    if (!bundle) return DEFAULT_HERO;

    return {
      title: bundle.hero?.title || DEFAULT_HERO.title,
      subtitle: bundle.hero?.subtitle || DEFAULT_HERO.subtitle,
    };
  },
  { maxAge: 300, authScoped: false }
);

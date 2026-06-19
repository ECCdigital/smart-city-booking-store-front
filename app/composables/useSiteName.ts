import { useCatalogStore } from "~~/stores/catalog.js";

export function useSiteName() {
  const { t } = useI18n();
  const catalogStore = useCatalogStore();
  const { data: hero } = useFetch("/api/theme/hero", {
    key: "theme-hero",
  });

  return computed(
    () =>
      catalogStore.catalog?.name ||
      hero.value?.title ||
      t("meta.siteNameFallback"),
  );
}

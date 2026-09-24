import { useCatalogStore } from "~~/stores/catalog.js";

/**
 * The name the site calls itself: the current Catalog's name where one is
 * loaded, otherwise the Portal Name from the Theme View, otherwise the
 * built-in fallback.
 */
export function useSiteName() {
  const { t } = useI18n();
  const catalogStore = useCatalogStore();
  const { data: theme } = useThemeBundle();

  return computed(
    () =>
      catalogStore.catalog?.name ||
      theme.value?.name ||
      t("meta.siteNameFallback"),
  );
}

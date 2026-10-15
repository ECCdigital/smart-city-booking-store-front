import { useCatalogStore } from "~~/stores/catalog.js";
import type { ThemeView } from "~~/shared/types/hero";

/**
 * The name the site calls itself: the current Catalog's name where one is
 * loaded, otherwise the Portal Name from the Theme View, otherwise the
 * built-in fallback.
 */
export function useSiteName() {
  const { t } = useI18n();
  const catalogStore = useCatalogStore();
  const { data: theme } = useThemeBundle();
  const themeName = computed(
    () => (theme.value as ThemeView | null)?.name,
  );

  return computed(
    () =>
      catalogStore.catalog?.name ||
      themeName.value ||
      t("meta.siteNameFallback"),
  );
}

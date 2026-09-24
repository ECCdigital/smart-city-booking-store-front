import type { ThemeView } from "~~/shared/types/hero";

/**
 * What the Live Preview shows in place of the stored Theme View: a Draft has
 * a Portal Name, a Hero Layout and a Background but no etag — it was never
 * saved — so the etag is the one field it cannot carry.
 */
export type HeroPreviewView = Omit<ThemeView, "etag">;

/**
 * The Draft the Live Preview is showing in place of the stored Theme View, or
 * `null` everywhere else. The preview page writes every Draft snapshot here
 * and clears it when it leaves; everything that reads the Theme View through
 * `useThemeBundle()` — the Hero, the site name, the auth pages — picks it up
 * without knowing that a preview exists.
 */
export function useHeroPreviewOverride() {
  return useState<HeroPreviewView | null>("hero-preview", () => null);
}

/**
 * The Theme View of one catalog, fetched once per full page load.
 *
 * Everything that paints the site — the Hero, the auth pages, the browser
 * title, the versioned stylesheet and favicon links — reads it, so the key is
 * fixed and every caller in one render shares a single request.
 *
 * It deliberately does not refetch on client-side navigation: the look of the
 * site is not page state, and an admin save becomes visible on the next full
 * page load, within the revalidation interval of storefront ADR 0001.
 *
 * @param slug - A catalog slug, or nothing for the instance catalog.
 * @returns The `useFetch` result with `data` replaced by a computed that
 *   prefers the Live Preview's override, plus `version`: the query suffix
 *   every theme asset URL carries so a saved change arrives as a new URL
 *   rather than after a cache lifetime. Empty until the first response has
 *   arrived. `version` always follows the fetched bundle — a Draft has no
 *   etag, and the stylesheet it is previewed under is the stored one.
 */
export function useThemeBundle(slug?: string | null) {
  const key = slug ? `theme-bundle:${slug}` : "theme-bundle";

  const result = useFetch("/api/theme/bundle", {
    key,
    query: slug ? { slug } : undefined,
    // Serving the payload back is what keeps a route change from refetching.
    getCachedData: (cacheKey, nuxtApp) =>
      nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey],
  });

  const override = useHeroPreviewOverride();
  const data = computed(() => override.value ?? result.data.value);

  const version = computed(() => {
    const etag = result.data.value?.etag;
    return etag ? `?v=${encodeURIComponent(etag)}` : "";
  });

  return { ...result, data, version };
}

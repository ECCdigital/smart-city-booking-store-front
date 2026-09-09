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
 * @returns The `useFetch` result, plus `version`: the query suffix every theme
 *   asset URL carries so a saved change arrives as a new URL rather than after
 *   a cache lifetime. Empty until the first response has arrived.
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

  const version = computed(() => {
    const etag = result.data.value?.etag;
    return etag ? `?v=${encodeURIComponent(etag)}` : "";
  });

  return { ...result, version };
}

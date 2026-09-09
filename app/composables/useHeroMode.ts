/**
 * Which kind of Hero a page wants. A page declares it as
 * `definePageMeta({ hero: "home" })`; every page that declares nothing gets the
 * compact one, which is what all the catalog sub-pages want.
 */
export type HeroMode = "home" | "compact";

export function useHeroMode(): ComputedRef<HeroMode> {
  const route = useRoute();

  return computed(() => (route.meta.hero === "home" ? "home" : "compact"));
}

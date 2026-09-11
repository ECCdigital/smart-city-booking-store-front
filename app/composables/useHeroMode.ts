import { previewHeroMode } from "~/utils/heroPreview";

/**
 * Which kind of Hero a page wants. A page declares it as
 * `definePageMeta({ hero: "home" })`; every page that declares nothing gets the
 * compact one, which is what all the catalog sub-pages want.
 *
 * The Hero's Live Preview declares `hero: "preview"` and shows either kind:
 * its mode follows the `?mode=` parameter, so the admin can open the same
 * frame on the start page or on a sub-page.
 */
export type HeroMode = "home" | "compact";

export function useHeroMode(): ComputedRef<HeroMode> {
  const route = useRoute();

  // The preview's mode is read once, from the URL the frame was opened with.
  // The catalog search beneath the Hero owns the query string and rewrites
  // it wholesale with its own keys, which would otherwise flip the preview
  // to the start page the moment a filter settles on its default. The frame
  // never changes its mode without a full reload — and the Hero lives in the
  // layout, which outlives the page, so the captured mode only counts while
  // the route is still the preview.
  const previewMode =
    route.meta.hero === "preview" ? previewHeroMode(route.query.mode) : null;

  return computed(() => {
    if (route.meta.hero === "preview" && previewMode) {
      return previewMode;
    }
    return route.meta.hero === "home" ? "home" : "compact";
  });
}

import type { HeroMode } from "~/composables/useHeroMode";

/**
 * Which arrangement the Live Preview shows, from its `?mode=` parameter:
 * `home` is the start page under the tall Hero, `compact` a catalog sub-page
 * under the Compact Hero. The start page is what an editor opens first, so it
 * is also what an absent or unknown value shows.
 *
 * The parameter is `mode`, not `view`: `view` already belongs to the catalog
 * search beneath the Hero, which reads it as its list/map switch.
 */
export function previewHeroMode(mode: unknown): HeroMode {
  return mode === "compact" ? "compact" : "home";
}

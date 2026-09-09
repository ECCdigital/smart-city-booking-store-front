/**
 * The rich-text policy of the Shared contract, shared by both sanitisers.
 *
 * The storefront sanitises rich text in two places with two DOMPurify
 * builds: the BFF over jsdom on every render (`server/utils/heroRichtext.ts`),
 * and the Live Preview in the browser for every Draft. Both must apply the
 * same allowlist and the same cap, and they can only be trusted to while this
 * is the one copy either reads. Nothing here touches a DOM, so it is safe to
 * import from `app/`, `shared/` and `server/` alike.
 */

import {
  HERO_RICHTEXT_MAX_LENGTH,
  type HeroLayout,
} from "~~/shared/types/hero";
import type { HeroParseIssue } from "~~/shared/utils/heroLayout";

/**
 * The frozen allowlist of the Shared contract, copied verbatim. Never passed
 * through `setConfig()`, never extended with hooks, never used `IN_PLACE`:
 * the same nine tags and three attributes are what the backend allows, and
 * the two copies are only trustworthy while they are identical. Cross-
 * reference: `.scratch/hero-layout/spec.md`, "Rich-text allowlist v1", and the
 * same block in the backend and admin specs.
 *
 * Relative URLs are rejected on purpose — a Hero link points at an external
 * page or an address, and internal navigation is not something an instance
 * admin should be able to smuggle into rich text.
 *
 * One consequence worth knowing before rendering a link: `target` and `rel`
 * are listed here but do not survive sanitising. DOMPurify matches every
 * attribute value against `ALLOWED_URI_REGEXP` unless the attribute is one of
 * its own `URI_SAFE_ATTRIBUTES`, and neither of these is; `_blank` and
 * `noopener` are not URIs. Hero links therefore open in the same tab.
 */
export const HERO_RICHTEXT_ALLOWLIST = Object.freeze({
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li"],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  KEEP_CONTENT: true,
});

/** Strips everything the allowlist does not name from one rich-text value. */
export type HeroRichtextSanitizer = (html: string) => string;

/**
 * Sanitises every rich-text Block of a layout in place.
 *
 * The contract caps rich text twice: 50 000 characters raw, which the guard
 * already enforced, and {@link HERO_RICHTEXT_MAX_LENGTH} after sanitising,
 * which only the sanitising side can measure. Over the cap the whole layout
 * is rejected, the same verdict the backend reaches on save, so the Fallback
 * Hero Layout — or the last valid Draft — takes over instead of a Hero built
 * around one runaway Block.
 *
 * @param layout - A layout the guard accepted; its Blocks are written to.
 * @param sanitize - The DOMPurify build of the calling side.
 * @param report - Where the over-cap field is reported.
 * @returns The layout, or `null` when a sanitised value is over the cap.
 */
export function sanitizeHeroLayoutRichtext(
  layout: HeroLayout,
  sanitize: HeroRichtextSanitizer,
  report: (issue: HeroParseIssue) => void,
): HeroLayout | null {
  for (const [index, block] of layout.blocks.entries()) {
    if (block.type !== "richtext") continue;

    for (const locale of ["de", "en"] as const) {
      const html = block.html[locale];
      if (html === undefined) continue;

      const sanitised = sanitize(html);
      if (sanitised.length > HERO_RICHTEXT_MAX_LENGTH) {
        report({
          path: `heroLayout.blocks[${index}].html.${locale}`,
          code: "max_length",
        });
        return null;
      }
      block.html[locale] = sanitised;
    }
  }

  return layout;
}

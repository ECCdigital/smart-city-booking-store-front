/**
 * The rich-text sanitiser for Hero Blocks.
 *
 * Rich text is sanitised twice: once by the backend when an editor saves it,
 * and again here, on every render, so a payload that reached the database
 * before the allowlist existed — or through some other door — still cannot put
 * markup into the page. The storefront renders the result with `v-html`, and
 * this module is the only reason that is safe.
 *
 * **Server-side only.** It pulls in jsdom, which must never reach the client
 * bundle, so nothing under `app/` or `shared/` may import it. The Live Preview
 * sanitises Drafts in the browser instead, with DOMPurify's browser build
 * behind a lazy import.
 */

import createDOMPurify, { type DOMPurify, type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";

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

/**
 * One jsdom window per process. Building it costs a few milliseconds and the
 * sanitiser runs on every theme revalidation, so it is created once and
 * reused; it holds no state between calls.
 */
let purify: DOMPurify | undefined;

function getPurify(): DOMPurify {
  if (!purify) {
    purify = createDOMPurify(new JSDOM("").window as unknown as WindowLike);
  }
  return purify;
}

/**
 * Strips everything the allowlist does not name from one rich-text value.
 *
 * @param html - The stored rich text of a Block, in one locale.
 * @returns Markup safe to hand to `v-html`.
 */
export function sanitizeHeroRichtext(html: string): string {
  return getPurify().sanitize(html, HERO_RICHTEXT_ALLOWLIST);
}

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
 * behind a lazy import — through the same two passes, which is why both the
 * allowlist and the class pass live in `shared/utils/heroRichtextAllowlist.ts`
 * and not here. All this module adds is the window the server build needs.
 */

import createDOMPurify, { type DOMPurify, type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";

import {
  buildHeroRichtextSanitizer,
  HERO_RICHTEXT_ALLOWLIST,
  type HeroRichtextSanitizer,
} from "~~/shared/utils/heroRichtextAllowlist";

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
 * Strips everything the contract does not name from one rich-text value:
 * DOMPurify against the frozen allowlist, then the class pass over what it
 * left, in that order. The builder ties the two together, so there is no
 * half-sanitised value for a caller here to get hold of.
 *
 * @param html - The stored rich text of a Block, in one locale.
 * @returns Markup safe to hand to `v-html`.
 */
export const sanitizeHeroRichtext: HeroRichtextSanitizer =
  buildHeroRichtextSanitizer((html) =>
    getPurify().sanitize(html, HERO_RICHTEXT_ALLOWLIST),
  );

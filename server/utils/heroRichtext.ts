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
 * behind a lazy import — against the same allowlist, which is why the
 * allowlist lives in `shared/utils/heroRichtextAllowlist.ts` and not here.
 */

import createDOMPurify, { type DOMPurify, type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";

import { HERO_RICHTEXT_ALLOWLIST } from "~~/shared/utils/heroRichtextAllowlist";

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

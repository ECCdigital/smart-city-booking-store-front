/**
 * The rich-text policy of the Shared contract, shared by both sanitisers.
 *
 * The storefront sanitises rich text in two places with two DOMPurify
 * builds: the BFF over jsdom on every render (`server/utils/heroRichtext.ts`),
 * and the Live Preview in the browser for every Draft. Sanitising is two
 * passes — the frozen allowlist, then the class pass that enforces the class
 * vocabulary — and both sides must run both, then measure the same cap on
 * what is left. They can only be trusted to while this is the one copy
 * either reads.
 *
 * Nothing here touches a DOM. The class pass walks an `htmlparser2` tree
 * instead, which is what lets it be shared: jsdom may never be imported from
 * `app/` or `shared/`, and this file is imported from all three. The parser
 * is reachable from every page through `useHeroMode()`, but only ever behind
 * the same dynamic import that already loads DOMPurify, so no visitor pays
 * for it up front.
 */

import render from "dom-serializer";
import { parseDocument } from "htmlparser2";

import {
  HERO_COLOR_TOKENS,
  HERO_RICHTEXT_MAX_LENGTH,
  HERO_TEXT_SIZES,
  HEX_COLOR_PATTERN,
  type HeroLayout,
} from "~~/shared/types/hero";
import type { HeroParseIssue } from "~~/shared/utils/heroLayout";

/**
 * The frozen allowlist of the Shared contract, copied verbatim. Never passed
 * through `setConfig()`, never extended with hooks, never used `IN_PLACE`:
 * the same ten tags and five attributes are what the backend allows, and
 * the two copies are only trustworthy while they are identical. Cross-
 * reference: `.scratch/hero-layout/spec.md`, "Rich-text allowlist", and the
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
 *
 * `data-color` would go the same way, which is what `ADD_URI_SAFE_ATTR` is
 * for: it lifts the URI test off that one attribute so a hex value survives.
 * It does not check the value — nothing here does. That check is the class
 * pass's, and it, not DOMPurify, is the security boundary for `data-color`.
 */
export const HERO_RICHTEXT_ALLOWLIST = Object.freeze({
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "span"],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "data-color"],
  ADD_URI_SAFE_ATTR: ["data-color"],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  KEEP_CONTENT: true,
});

/**
 * The class vocabulary of the Shared contract: every `class` token that may
 * still be in rendered rich text, grouped by what it decides. The size and
 * colour groups are the Block's own vocabularies spelled as classes, because
 * a marked word says the same things a Block says; alignment is not, and is
 * written out for it: there is no `hero-align-auto`, just as there is no
 * `hero-color-black`. The absence of a class is what "inherits from the
 * Block" means, and `black` belongs to Panels.
 */
export const HERO_RICHTEXT_CLASSES = Object.freeze({
  align: Object.freeze([
    "hero-align-left",
    "hero-align-center",
    "hero-align-right",
  ]),
  size: Object.freeze(HERO_TEXT_SIZES.map((size) => `hero-size-${size}`)),
  color: Object.freeze(
    HERO_COLOR_TOKENS.map((color) => `hero-color-${color}`),
  ),
});

/** Strips everything the contract does not name from one rich-text value. */
export type HeroRichtextSanitizer = (html: string) => string;

/** A node of the tree the class pass walks: an element, some text, a comment. */
type HeroRichtextNode = ReturnType<typeof parseDocument>["children"][number];

/** The one kind of node that carries attributes, and so the only one this pass edits. */
type HeroRichtextElement = Extract<
  HeroRichtextNode,
  { attribs: Record<string, string> }
>;

function isElement(node: HeroRichtextNode): node is HeroRichtextElement {
  return "attribs" in node;
}

/**
 * The tokens of one `class` attribute that are in the vocabulary, in the
 * order they were written, at most one per group.
 *
 * Both halves of that sentence are repair rules. A token no group names is
 * dropped whether or not it is `hero-`-prefixed, so a `hero-size-huge` goes
 * the way of a `promo`; and where an author managed two sizes or two colours,
 * the first in document order wins. Class order decides nothing in CSS, so
 * that is a normalisation choice — it keeps one of the two instead of
 * discarding both.
 */
function keptClasses(
  value: string | undefined,
  groups: readonly (readonly string[])[],
): string[] {
  if (!value) return [];

  const taken = new Set<readonly string[]>();
  return value.split(/\s+/).filter((token) => {
    const group = groups.find((candidate) => candidate.includes(token));
    if (!group || taken.has(group)) return false;
    taken.add(group);
    return true;
  });
}

/**
 * A `data-color` the contract recognises, lower-cased, or nothing.
 *
 * This is the security boundary for the attribute. `ADD_URI_SAFE_ATTR` only
 * excuses the value from DOMPurify's URI test and checks nothing itself, so
 * whatever the storefront later writes into a `style` has been through these
 * six hex digits and no other gate.
 */
function customColor(value: string | undefined): string | undefined {
  const hex = value?.toLowerCase();
  return hex !== undefined && HEX_COLOR_PATTERN.test(hex) ? hex : undefined;
}

/**
 * What one element keeps of `class`, `data-color` and `style`. Everything
 * else it carries is the allowlist's business and is left alone; these three
 * are the class pass's, and on an element the vocabulary does not name — a
 * `<strong>`, an `<a>` — all three simply go.
 */
function vocabularyAttributes(
  element: HeroRichtextElement,
): Record<string, string> {
  const attribs = { ...element.attribs };
  delete attribs.class;
  delete attribs["data-color"];
  delete attribs.style;

  if (element.name === "p") {
    const align = keptClasses(element.attribs.class, [
      HERO_RICHTEXT_CLASSES.align,
    ]);
    if (align.length > 0) attribs.class = align.join(" ");
    return attribs;
  }

  if (element.name === "span") {
    const marks = keptClasses(element.attribs.class, [
      HERO_RICHTEXT_CLASSES.size,
      HERO_RICHTEXT_CLASSES.color,
    ]);
    if (marks.length > 0) attribs.class = marks.join(" ");

    // A token and a custom colour on one span is something no editor can
    // produce, so the input was hand-forged and the ambiguity should lead
    // away from the attribute that turns into paint: the token wins.
    const custom = marks.some((mark) =>
      HERO_RICHTEXT_CLASSES.color.includes(mark),
    )
      ? undefined
      : customColor(element.attribs["data-color"]);

    if (custom) {
      attribs["data-color"] = custom;
      attribs.style = `color:${custom}`;
    }
  }

  return attribs;
}

/**
 * The class pass over one already-allowlisted subtree, depth first: every
 * element keeps what the vocabulary names and nothing else.
 */
function walk(nodes: HeroRichtextNode[]): HeroRichtextNode[] {
  return nodes.flatMap((node) => {
    if (!isElement(node)) return [node];

    node.children = walk(node.children);
    node.attribs = vocabularyAttributes(node);

    // An emptied `class` is already gone with the attribute it was on, and a
    // span carrying nothing at all is not a mark: it leaves its text behind
    // and goes. The admin's editor drops the same span while loading, so the
    // two agree at the edge; this rule is here for input that never met it.
    return node.name === "span" && Object.keys(node.attribs).length === 0
      ? node.children
      : [node];
  });
}

/**
 * The second half of sanitising: the walk that enforces the class vocabulary
 * over markup the allowlist pass has already been through.
 *
 * It repairs rather than rejects — a token outside the vocabulary costs its
 * element the token, never the reader the text — and it is the one place a
 * `style` is written into rich text.
 *
 * The walk gets its tree from `htmlparser2` rather than from a DOM, which is
 * what lets the two sanitisers share this one implementation: jsdom may never
 * be imported from `app/` or `shared/`, and a pass that took a window would
 * have to be handed a different one on each side and could then be handed
 * none. There is no window to get wrong here.
 *
 * @param html - The output of the allowlist pass, in one locale.
 * @returns The same markup with only the vocabulary left on it.
 */
export function heroRichtextClassPass(html: string): string {
  const document = parseDocument(html);
  document.children = walk(document.children);

  // `utf8` escapes what has to be escaped and leaves the rest alone. The
  // default would spell every umlaut of a German Hero as a numeric entity,
  // which reads the same but counts several times over against the cap.
  return render(document, { encodeEntities: "utf8" });
}

/** The allowlist pass alone: one side's DOMPurify build, bound to the frozen allowlist. */
export type HeroRichtextAllowlistPass = (html: string) => string;

/**
 * Ties one side's DOMPurify build to the class pass, which is what
 * "sanitising" means: allowlist first, then the vocabulary.
 *
 * Both sanitising sites build their function through here, so neither can
 * end up running the first pass alone — the DOMPurify build never leaves
 * this expression, and what the rest of the storefront gets to hold is the
 * pair.
 *
 * @param allowlistPass - DOMPurify with {@link HERO_RICHTEXT_ALLOWLIST}.
 * @returns The sanitiser of that side.
 */
export function buildHeroRichtextSanitizer(
  allowlistPass: HeroRichtextAllowlistPass,
): HeroRichtextSanitizer {
  return (html) => heroRichtextClassPass(allowlistPass(html));
}

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
 * The order the contract gives is the order here: both passes, then the
 * measurement. What is measured is therefore what is delivered, and rich
 * text that was only over the cap through classes the class pass drops
 * anyway is not rejected for them.
 *
 * @param layout - A layout the guard accepted; its Blocks are written to.
 * @param sanitize - Both passes of the calling side, from
 *   {@link buildHeroRichtextSanitizer}.
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

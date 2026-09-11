import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import createDOMPurify, { type Config, type WindowLike } from "dompurify";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

import { sanitizeHeroRichtext } from "~~/server/utils/heroRichtext";
import {
  HERO_RICHTEXT_MAX_LENGTH,
  type HeroLayout,
  type HeroRichtextBlock,
} from "~~/shared/types/hero";
import type { HeroParseIssue } from "~~/shared/utils/heroLayout";
import {
  buildHeroRichtextSanitizer,
  HERO_RICHTEXT_ALLOWLIST,
  heroRichtextClassPass,
  sanitizeHeroLayoutRichtext,
} from "~~/shared/utils/heroRichtextAllowlist";

import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";

/**
 * A DOMPurify of this test file's own, for the cases that need the allowlist
 * pass without the class pass behind it — what the frozen config alone does,
 * and what the browser side builds its sanitiser out of.
 */
const purify = createDOMPurify(new JSDOM("").window as unknown as WindowLike);

describe("sanitizeHeroRichtext", () => {
  it("leaves the rich text of the crowded fixture untouched", () => {
    const block = crowdedHeroLayout.blocks[0] as { html: Record<string, string> };

    expect(sanitizeHeroRichtext(block.html.de)).toBe(block.html.de);
    expect(sanitizeHeroRichtext(block.html.en)).toBe(block.html.en);
  });

  it("keeps every tag on the allowlist", () => {
    const html =
      '<p>Ein <strong>fetter</strong>, <em>schräger</em> und <u>unterstrichener</u> Satz.<br><a href="https://example.org">Mehr</a> <span class="hero-color-primary">bunt</span></p><ul><li>eins</li></ul><ol><li>zwei</li></ol>';

    const sanitized = sanitizeHeroRichtext(html);

    for (const tag of HERO_RICHTEXT_ALLOWLIST.ALLOWED_TAGS) {
      expect(sanitized).toContain(`<${tag}`);
    }
  });

  it("removes a script and its payload", () => {
    const sanitized = sanitizeHeroRichtext(
      '<p>Hallo</p><script>alert("xss")</script>',
    );

    expect(sanitized).toBe("<p>Hallo</p>");
  });

  it("removes an event handler attribute but keeps the text", () => {
    expect(sanitizeHeroRichtext('<p onclick="steal()">Hallo</p>')).toBe(
      "<p>Hallo</p>",
    );
  });

  it("unwraps a heading instead of dropping its text", () => {
    // KEEP_CONTENT: a tag the allowlist does not name loses its element, not
    // the copy an admin wrote inside it.
    expect(sanitizeHeroRichtext("<h1>Willkommen</h1>")).toBe("Willkommen");
  });

  it("removes images and inline styles", () => {
    expect(sanitizeHeroRichtext('<img src="https://example.org/x.png">')).toBe(
      "",
    );
    expect(sanitizeHeroRichtext('<p style="color:red">Rot</p>')).toBe(
      "<p>Rot</p>",
    );
  });

  it("keeps http, https and mailto links", () => {
    const html =
      '<p><a href="https://example.org">Web</a> <a href="http://example.org">Alt</a> <a href="mailto:info@example.org">Mail</a></p>';

    expect(sanitizeHeroRichtext(html)).toBe(html);
  });

  it("does not keep target and rel, although the allowlist names them", () => {
    // DOMPurify matches every attribute value against `ALLOWED_URI_REGEXP`
    // unless the attribute is one of its own `URI_SAFE_ATTRIBUTES`, which
    // `target` and `rel` are not. Against the contract's deliberately narrow
    // regexp, `_blank` and `noopener` are not URIs, so both attributes go.
    // Listing them in `ALLOWED_ATTR` is therefore not enough — lifting the
    // restriction would mean `ADD_URI_SAFE_ATTR`, a change to the frozen
    // allowlist and so to all three specs, not a local decision. The effect is
    // harmless: Hero links open in the same tab and need no `noopener`.
    expect(
      sanitizeHeroRichtext(
        '<a href="https://example.org" target="_blank" rel="noopener">Web</a>',
      ),
    ).toBe('<a href="https://example.org">Web</a>');
  });

  it("rejects a relative link", () => {
    expect(sanitizeHeroRichtext('<a href="/bookables">Angebote</a>')).toBe(
      "<a>Angebote</a>",
    );
  });

  it("rejects a javascript: link", () => {
    expect(sanitizeHeroRichtext('<a href="javascript:alert(1)">Klick</a>')).toBe(
      "<a>Klick</a>",
    );
  });

  it("rejects a data: link", () => {
    expect(
      sanitizeHeroRichtext('<a href="data:text/html,<b>x</b>">Klick</a>'),
    ).toBe("<a>Klick</a>");
  });

  it("drops data and aria attributes", () => {
    expect(
      sanitizeHeroRichtext('<p data-id="7" aria-label="Titel">Hallo</p>'),
    ).toBe("<p>Hallo</p>");
  });

  it("survives being called twice with the same process-wide window", () => {
    expect(sanitizeHeroRichtext("<p>Eins</p>")).toBe("<p>Eins</p>");
    expect(sanitizeHeroRichtext("<p>Zwei</p>")).toBe("<p>Zwei</p>");
  });

  it("does not let a call reconfigure the allowlist for the next one", () => {
    expect(Object.isFrozen(HERO_RICHTEXT_ALLOWLIST)).toBe(true);

    sanitizeHeroRichtext("<h1>Erst</h1>");

    expect(sanitizeHeroRichtext("<h1>Dann</h1>")).toBe("Dann");
  });
});

describe("the server-only boundary of the sanitiser", () => {
  const SOURCE_EXTENSIONS = [".ts", ".js", ".vue"];

  function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))
        ? [path]
        : [];
    });
  }

  it("is imported from nowhere under app/ or shared/", () => {
    // jsdom in the client bundle would be megabytes of parser shipped to every
    // visitor, so the sanitiser stays behind the BFF. The Live Preview uses
    // DOMPurify's browser build instead.
    const offenders = ["app", "shared"]
      .flatMap((directory) => sourceFiles(directory))
      .filter((path) =>
        /from\s+["'][^"']*(heroRichtext|jsdom)["']/.test(
          readFileSync(path, "utf8"),
        ),
      );

    expect(offenders).toEqual([]);
  });
});

describe("the class vocabulary", () => {
  it("keeps a span with a size and a colour class", () => {
    const html = '<p><span class="hero-size-lg hero-color-primary">Wort</span></p>';

    expect(sanitizeHeroRichtext(html)).toBe(html);
  });

  it("keeps an alignment class on a paragraph", () => {
    const html = '<p class="hero-align-center">Mitte</p>';

    expect(sanitizeHeroRichtext(html)).toBe(html);
  });

  it("drops a class outside the vocabulary and keeps the text", () => {
    expect(sanitizeHeroRichtext('<p class="promo">Hallo</p>')).toBe(
      "<p>Hallo</p>",
    );
    expect(sanitizeHeroRichtext('<p class="hero-align-auto">Hallo</p>')).toBe(
      "<p>Hallo</p>",
    );
    expect(
      sanitizeHeroRichtext('<span class="hero-size-huge">Gross</span>x'),
    ).toBe("Grossx");
    expect(
      sanitizeHeroRichtext('<span class="hero-color-black">Schwarz</span>x'),
    ).toBe("Schwarzx");
  });
});

describe("a custom colour in rich text", () => {
  it("becomes the style it exists for", () => {
    expect(sanitizeHeroRichtext('<span data-color="#ff0000">Rot</span>')).toBe(
      '<span data-color="#ff0000" style="color:#ff0000">Rot</span>',
    );
  });

  it("is lower-cased", () => {
    expect(sanitizeHeroRichtext('<span data-color="#FF0000">Rot</span>')).toBe(
      '<span data-color="#ff0000" style="color:#ff0000">Rot</span>',
    );
  });

  it("is dropped unless it is six hex digits", () => {
    for (const value of ["red", "#FFF", "#GGGGGG", "#ff00", "rgb(255,0,0)"]) {
      expect(sanitizeHeroRichtext(`<span data-color="${value}">Rot</span>`)).toBe(
        "Rot",
      );
    }
  });

  it("loses to a colour token on the same span", () => {
    expect(
      sanitizeHeroRichtext(
        '<span class="hero-color-primary" data-color="#ff0000">Wort</span>',
      ),
    ).toBe('<span class="hero-color-primary">Wort</span>');
  });
});

describe("the class pass against the rest of the markup", () => {
  it("drops class and data-color on every element the vocabulary does not name", () => {
    expect(
      sanitizeHeroRichtext(
        '<ul class="hero-align-center"><li class="hero-size-lg" data-color="#ff0000">eins</li></ul>',
      ),
    ).toBe("<ul><li>eins</li></ul>");
    expect(
      sanitizeHeroRichtext(
        '<p><a href="https://example.org" class="hero-color-primary">Web</a> <strong data-color="#ff0000">fett</strong></p>',
      ),
    ).toBe('<p><a href="https://example.org">Web</a> <strong>fett</strong></p>');
  });

  it("drops a data-color on a paragraph, which has no custom colour", () => {
    // The table gives `p` the alignment class and nothing else; a custom
    // colour is a mark on a word, and a word is a span.
    expect(
      sanitizeHeroRichtext(
        '<p class="hero-align-left" data-color="#ff0000">Links</p>',
      ),
    ).toBe('<p class="hero-align-left">Links</p>');
  });

  it("keeps the first size and the first colour of a span", () => {
    expect(
      sanitizeHeroRichtext(
        '<span class="hero-size-sm hero-size-xl hero-color-white hero-color-primary">Wort</span>',
      ),
    ).toBe('<span class="hero-size-sm hero-color-white">Wort</span>');
  });

  it("keeps the first alignment of a paragraph", () => {
    expect(
      sanitizeHeroRichtext(
        '<p class="hero-align-right hero-align-center">Rechts</p>',
      ),
    ).toBe('<p class="hero-align-right">Rechts</p>');
  });

  it("unwraps a span that carried nothing and keeps the marked span inside it", () => {
    expect(
      sanitizeHeroRichtext(
        '<p><span class="promo">vor <span class="hero-size-xl">gross</span> nach</span></p>',
      ),
    ).toBe('<p>vor <span class="hero-size-xl">gross</span> nach</p>');
  });

  it("unwraps a span that kept nothing, even when an allowlist attribute survived on it", () => {
    // `ALLOWED_ATTR` is not per tag, so `href`, `target` and `rel` reach a
    // span and survive the allowlist pass. They are inert there, but they
    // would make a span with nothing of the vocabulary look like a mark; the
    // contract says such a span is not a mark at all, so it goes with them.
    for (const html of [
      '<p><span href="https://example.org" class="promo">Text</span></p>',
      '<p><span target="_blank">Text</span></p>',
      '<p><span rel="noopener">Text</span></p>',
    ]) {
      expect(sanitizeHeroRichtext(html)).toBe("<p>Text</p>");
    }
  });

  it("keeps an allowlist attribute on a span that is a mark", () => {
    // The rule is about the vocabulary, not about tidiness: once a span
    // carries a mark, what else it holds is the allowlist pass's business.
    expect(
      sanitizeHeroRichtext(
        '<p><span class="hero-size-lg" href="https://example.org">Gross</span></p>',
      ),
    ).toBe('<p><span href="https://example.org" class="hero-size-lg">Gross</span></p>');
  });

  it("leaves its own output alone the second time", () => {
    // The contract sanitises on save and again on render, so the render pass
    // meets markup the backend already sanitised. It must be a fixed point:
    // the allowlist strips the built `style` again, and the class pass builds
    // the same one back from the `data-color` that survived beside it.
    for (const html of [
      '<span data-color="#FF0000">Rot</span>',
      '<p class="hero-align-center"><span class="hero-size-lg hero-color-primary">Wort</span></p>',
      '<p class="promo"><span>Wort</span></p>',
      '<span class="hero-size-lg" data-color="#00ff00">Wort</span>',
    ]) {
      const once = sanitizeHeroRichtext(html);

      expect(sanitizeHeroRichtext(once)).toBe(once);
    }
  });

  it("never lets an incoming style through on its own", () => {
    expect(
      sanitizeHeroRichtext('<span style="color:red">Rot</span>'),
    ).toBe("Rot");
    expect(
      sanitizeHeroRichtext(
        '<span class="hero-size-lg" style="color:red">Gross</span>',
      ),
    ).toBe('<span class="hero-size-lg">Gross</span>');
  });

  it("carries no style of its own through, only the one it builds", () => {
    // The allowlist drops `style` before the class pass ever sees one, so
    // this asks the pass alone, where the claim is actually testable: the
    // rendered `style` is built from a validated hex or it is not there.
    expect(
      heroRichtextClassPass(
        '<p style="color:red"><span class="hero-size-lg" style="color:red">Gross</span></p>',
      ),
    ).toBe('<p><span class="hero-size-lg">Gross</span></p>');
    expect(
      heroRichtextClassPass(
        '<span data-color="#00ff00" style="color:red">Gruen</span>',
      ),
    ).toBe('<span data-color="#00ff00" style="color:#00ff00">Gruen</span>');
  });
});

describe("the caps against the class pass", () => {
  /** The crowded fixture's rich-text Block carrying one locale of new markup. */
  function richtextLayout(html: string): HeroLayout {
    const layout = structuredClone(crowdedHeroLayout) as unknown as HeroLayout;
    (layout.blocks[0] as HeroRichtextBlock).html = { de: html };
    return layout;
  }

  it("measures what it delivers, not what the allowlist left", () => {
    // The class pass runs between `sanitize()` and the 10 000 characters, so
    // rich text that was only over the cap through junk classes is not
    // rejected for them: what is measured is what the visitor gets.
    const html = `<p class="${"promo ".repeat(2000)}hero-align-center">Kurz</p>`;
    const layout = richtextLayout(html);
    const issues: HeroParseIssue[] = [];

    expect(
      purify.sanitize(html, HERO_RICHTEXT_ALLOWLIST).length,
    ).toBeGreaterThan(HERO_RICHTEXT_MAX_LENGTH);

    expect(
      sanitizeHeroLayoutRichtext(layout, sanitizeHeroRichtext, (issue) =>
        issues.push(issue),
      ),
    ).toBe(layout);
    expect(issues).toEqual([]);
    expect((layout.blocks[0] as HeroRichtextBlock).html.de).toBe(
      '<p class="hero-align-center">Kurz</p>',
    );
  });

  it("still rejects a layout whose rich text is over the cap after both passes", () => {
    const layout = richtextLayout(`<p>${"a".repeat(HERO_RICHTEXT_MAX_LENGTH)}</p>`);
    const issues: HeroParseIssue[] = [];

    expect(
      sanitizeHeroLayoutRichtext(layout, sanitizeHeroRichtext, (issue) =>
        issues.push(issue),
      ),
    ).toBeNull();
    expect(issues).toEqual([
      { path: "heroLayout.blocks[0].html.de", code: "max_length" },
    ]);
  });
});

describe("the two copies of the contract", () => {
  /**
   * The allowlist as the Shared contract writes it, transcribed from
   * `.scratch/hero-layout/spec.md`, "Rich-text allowlist". The backend holds
   * the same block, and the two are only worth trusting while they are the
   * same text — so this compares text, not a parsed object: a reordered key
   * or an added one is a change to all three specs, never a local decision.
   */
  const CONTRACT_ALLOWLIST = `Object.freeze({
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "span"],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "data-color"],
  ADD_URI_SAFE_ATTR: ["data-color"],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  KEEP_CONTENT: true,
});`;

  it("spells the allowlist character for character", () => {
    expect(
      readFileSync("shared/utils/heroRichtextAllowlist.ts", "utf8"),
    ).toContain(CONTRACT_ALLOWLIST);
  });

  it("keeps data-color only because of ADD_URI_SAFE_ATTR", () => {
    // Without it DOMPurify matches the hex against `ALLOWED_URI_REGEXP` and
    // drops the attribute, exactly as it drops `target` and `rel`. Listing
    // `data-color` in `ALLOWED_ATTR` is not enough on its own.
    const withoutUriSafeAttr: Record<string, unknown> = {
      ...HERO_RICHTEXT_ALLOWLIST,
    };
    delete withoutUriSafeAttr.ADD_URI_SAFE_ATTR;
    const html = '<span data-color="#ff0000">Rot</span>';

    expect(purify.sanitize(html, HERO_RICHTEXT_ALLOWLIST)).toBe(html);
    expect(purify.sanitize(html, withoutUriSafeAttr as Config)).toBe(
      "<span>Rot</span>",
    );
  });
});

describe("the browser Draft path", () => {
  // The Live Preview holds no jsdom: the bridge hands DOMPurify's browser
  // build to the same builder, so both passes come with it. A window stood
  // up here is as close as a node test gets to that arrangement.
  const sanitize = buildHeroRichtextSanitizer((html) =>
    purify.sanitize(html, HERO_RICHTEXT_ALLOWLIST),
  );

  it("builds its sanitiser through the builder, not from DOMPurify alone", () => {
    // The builder is the only way to a sanitiser that is both passes; a
    // bare `DOMPurify.sanitize` closure would silently deliver rich text the
    // class pass never saw, and only in the preview.
    const bridge = readFileSync(
      "app/components/hero/HeroPreviewBridge.client.vue",
      "utf8",
    );

    expect(bridge).toMatch(/buildHeroRichtextSanitizer\(/);
  });

  it("runs both passes", () => {
    expect(sanitize('<p class="hero-align-center">Mitte</p>')).toBe(
      '<p class="hero-align-center">Mitte</p>',
    );
    expect(sanitize('<span data-color="#FF0000">Rot</span>')).toBe(
      '<span data-color="#ff0000" style="color:#ff0000">Rot</span>',
    );
    expect(sanitize('<span class="promo">Wort</span>')).toBe("Wort");
  });

  it("still strips a script payload and a javascript: href", () => {
    expect(sanitize('<p>Hallo</p><script>alert("xss")</script>')).toBe(
      "<p>Hallo</p>",
    );
    expect(sanitize('<a href="javascript:alert(1)">Klick</a>')).toBe(
      "<a>Klick</a>",
    );
  });
});

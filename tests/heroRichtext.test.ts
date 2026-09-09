import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { sanitizeHeroRichtext } from "~~/server/utils/heroRichtext";
import { HERO_RICHTEXT_ALLOWLIST } from "~~/shared/utils/heroRichtextAllowlist";

import crowdedHeroLayout from "./fixtures/hero-layout/crowded-hero-layout.json";

describe("sanitizeHeroRichtext", () => {
  it("leaves the rich text of the crowded fixture untouched", () => {
    const block = crowdedHeroLayout.blocks[0] as { html: Record<string, string> };

    expect(sanitizeHeroRichtext(block.html.de)).toBe(block.html.de);
    expect(sanitizeHeroRichtext(block.html.en)).toBe(block.html.en);
  });

  it("keeps every tag on the allowlist", () => {
    const html =
      '<p>Ein <strong>fetter</strong>, <em>schräger</em> und <u>unterstrichener</u> Satz.<br><a href="https://example.org">Mehr</a></p><ul><li>eins</li></ul><ol><li>zwei</li></ol>';

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

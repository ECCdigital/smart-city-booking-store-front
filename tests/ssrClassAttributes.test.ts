import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { compileTemplate, parse } from "vue/compiler-sfc";

/** Every single-file component of the app, as a path from the repo root. */
function componentFiles(dir = "app"): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return componentFiles(path);
    return entry.name.endsWith(".vue") ? [path] : [];
  });
}

/** The server render function Vue builds for a component's template. */
function ssrCodeOf(file: string): string {
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  if (!descriptor.template) return "";
  return compileTemplate({
    source: descriptor.template.content,
    filename: file,
    id: file,
    ssr: true,
    ssrCssVars: [],
  }).code;
}

describe("the server-rendered HTML", () => {
  // A browser keeps the first of two `class` attributes and drops the second.
  // Vue's server compiler writes an empty static `class=""` out on its own,
  // next to the bound one, so the element loses every bound class on a
  // server-rendered page. On the phone that took the height of a result card's
  // picture away, and the Kind badge of a card without a picture lay on the
  // title (ECCdigital/tickets#270).
  //
  // Only an empty static `class` sets this off, so only components that have
  // one are compiled; compiling all of them takes longer than a test may.
  it("never gives one element two class attributes", () => {
    const doubled = componentFiles()
      .filter((file) => /\sclass="\s*"/.test(readFileSync(file, "utf8")))
      .filter((file) => /class="[^"$]*" class=/.test(ssrCodeOf(file)));

    expect(doubled).toEqual([]);
  });
});

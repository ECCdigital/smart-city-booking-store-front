import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { compileTemplate, parse } from "vue/compiler-sfc";

/**
 * The part of a node of Vue's template AST this file reads: elements are
 * `type` 1 with a `tag`, static attributes are `type` 6 with a `value`.
 */
interface TemplateNode {
  type: number;
  tag?: string;
  props?: { type: number; name: string; value?: { content: string } }[];
  children?: TemplateNode[];
}

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

/** The template of a component as a tree of nodes. */
function templateOf(file: string): TemplateNode {
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  return descriptor.template!.ast as unknown as TemplateNode;
}

/** The static `class` of an element, split into its classes. */
function classesOf(node: TemplateNode): string[] {
  const attr = node.props?.find(
    (prop) => prop.type === 6 && prop.name === "class",
  );
  return attr?.value?.content.split(/\s+/).filter(Boolean) ?? [];
}

/** The chain of nodes from the template root down to the first `tag`. */
function pathTo(node: TemplateNode, tag: string): TemplateNode[] | null {
  if (node.tag === tag) return [node];
  for (const child of node.children ?? []) {
    if (child.type !== 1) continue;
    const path = pathTo(child, tag);
    if (path) return [node, ...path];
  }
  return null;
}

describe("the server-rendered HTML", () => {
  // A browser keeps the first of two `class` attributes and drops the second.
  // Vue's server compiler writes an empty static `class=""` out on its own,
  // next to the bound one, so the element loses every bound class on a
  // server-rendered page. On the phone that took the height of a result card's
  // picture away, and the Kind badge of a card without a picture lay on the
  // title.
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

describe("the Kind badge over a picture", () => {
  // The badge carries `z-10` to stay above the picture next to it. Outside a
  // stacking context of its own that `z-10` competes with the sticky
  // navigation bar (also `z-10`, see NavigationBar.vue), and the later element
  // wins: the badge slid over the bar on the phone. `isolate` keeps the badge's
  // stacking inside the picture.
  it.each([
    "app/components/search/ResultCard.vue",
    "app/components/search/ResultStrip.vue",
    "app/components/detailsArea/DetailsAreaImage.vue",
  ])("stays below the navigation bar in %s", (file) => {
    const path = pathTo(templateOf(file), "BookableTypeBadge");

    expect(path).not.toBeNull();
    const isolated = path!
      .slice(0, -1)
      .some((element) => classesOf(element).includes("isolate"));
    expect(isolated).toBe(true);
  });
});

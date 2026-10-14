import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { parse } from "vue/compiler-sfc";

/** Vue's `NodeTypes` for an element and a static attribute. */
const ELEMENT = 1;
const ATTRIBUTE = 6;

/** The part of a node of Vue's template AST this file reads. */
interface TemplateNode {
  type: number;
  tag?: string;
  props?: { type: number; name: string; value?: { content: string } }[];
  children?: TemplateNode[];
}

/** The template of a component as a tree of nodes. */
function templateOf(file: string): TemplateNode {
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  return descriptor.template!.ast as unknown as TemplateNode;
}

/** The static `class` of an element, split into its classes. */
function classesOf(node: TemplateNode): string[] {
  const attr = node.props?.find(
    (prop) => prop.type === ATTRIBUTE && prop.name === "class",
  );
  return attr?.value?.content.split(/\s+/).filter(Boolean) ?? [];
}

/** The chain of nodes from the template root down to the first `tag`. */
function pathTo(node: TemplateNode, tag: string): TemplateNode[] | null {
  if (node.tag === tag) return [node];
  for (const child of node.children ?? []) {
    if (child.type !== ELEMENT) continue;
    const path = pathTo(child, tag);
    if (path) return [node, ...path];
  }
  return null;
}

describe("the Kind badge over a picture", () => {
  // The badge carries `z-10` to stay above the picture next to it. Outside a
  // stacking context of its own that `z-10` competes with the sticky
  // navigation bar (also `z-10`, see NavigationBar.vue), and the later element
  // wins: the badge slid over the bar on the phone (ECCdigital/tickets#270).
  // `isolate` keeps the badge's stacking inside the picture.
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

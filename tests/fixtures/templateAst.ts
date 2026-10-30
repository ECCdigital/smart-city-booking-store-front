import { readFileSync } from "node:fs";

import { parse } from "vue/compiler-sfc";

/** Vue's `NodeTypes` for an element and a static attribute. */
const ELEMENT = 1;
const ATTRIBUTE = 6;

/** The part of a node of Vue's template AST the tests read. */
export interface TemplateNode {
  type: number;
  tag?: string;
  props?: { type: number; name: string; value?: { content: string } }[];
  children?: TemplateNode[];
}

/** The template of a component as a tree of nodes. */
export function templateOf(file: string): TemplateNode {
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  return descriptor.template!.ast as unknown as TemplateNode;
}

/** The static `class` of an element, split into its classes. */
export function classesOf(node: TemplateNode): string[] {
  const attr = node.props?.find(
    (prop) => prop.type === ATTRIBUTE && prop.name === "class",
  );
  return attr?.value?.content.split(/\s+/).filter(Boolean) ?? [];
}

/** The chain of nodes from the template root down to the first match. */
export function pathTo(
  node: TemplateNode,
  matches: (node: TemplateNode) => boolean,
): TemplateNode[] | null {
  if (matches(node)) return [node];
  for (const child of node.children ?? []) {
    if (child.type !== ELEMENT) continue;
    const path = pathTo(child, matches);
    if (path) return [node, ...path];
  }
  return null;
}

/** Whether an element above the last one of `path` is `isolate`. */
export function isolatedAbove(path: TemplateNode[]): boolean {
  return path
    .slice(0, -1)
    .some((element) => classesOf(element).includes("isolate"));
}

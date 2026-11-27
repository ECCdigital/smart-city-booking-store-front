import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  classesOf,
  templateOf,
  type TemplateNode,
} from "./fixtures/templateAst";

/** Every `.vue` file below a directory. */
function vueFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".vue"))
    .map((file) => join(dir, file));
}

/** Every element of a template, depth first. */
function elementsOf(node: TemplateNode): TemplateNode[] {
  const children = (node.children ?? []).filter((child) => child.type === 1);
  return [node, ...children.flatMap(elementsOf)];
}

/** Whether an element draws a glass surface of its own. */
function isOwnGlass(node: TemplateNode): boolean {
  return classesOf(node).some(
    (name) => name === "glass" || name.startsWith("backdrop-blur"),
  );
}

/**
 * The instance can turn the glass effect of the auth cards off
 * (ECCdigital/tickets#1365): PageBackground carries `authCardStyle` of the
 * Theme View, and main.css draws every `.auth-card` as glass or, below a
 * `solid` one, opaque. A card with glass classes of its own would stay glass.
 */
describe("the cards of the auth pages", () => {
  const files = [
    ...vueFiles("app/components/auth"),
    ...vueFiles("app/pages/auth"),
    ...vueFiles("app/pages/sso"),
  ];

  it("finds the auth cards it guards", () => {
    const cards = files.flatMap((file) =>
      elementsOf(templateOf(file)).filter((node) =>
        classesOf(node).includes("auth-card"),
      ),
    );

    expect(cards.length).toBeGreaterThanOrEqual(20);
  });

  it.each(files)("leaves the surface of %s to auth-card", (file) => {
    const ownGlass = elementsOf(templateOf(file)).filter(isOwnGlass);

    expect(ownGlass).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";

import { isolatedAbove, pathTo, templateOf } from "./fixtures/templateAst";

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
    const path = pathTo(
      templateOf(file),
      (node) => node.tag === "BookableTypeBadge",
    );

    expect(path).not.toBeNull();
    expect(isolatedAbove(path!)).toBe(true);
  });
});

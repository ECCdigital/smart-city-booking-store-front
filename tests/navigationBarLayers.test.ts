import { describe, expect, it } from "vitest";

import {
  classesOf,
  isolatedAbove,
  pathTo,
  templateOf,
} from "./fixtures/templateAst";

describe("page content below the navigation bar", () => {
  // Like the Kind badge (ECCdigital/tickets#270): an element with `z-10`
  // outside a stacking context of its own competes with the sticky navigation
  // bar's `z-10`, and the later element wins. On the phone the map slid over
  // the bar (ECCdigital/tickets#310). `isolate` above it keeps it below.
  it.each([
    "app/components/search/ResultsMap.vue",
    "app/components/mobileKey/AccessPointLoadingSpinner.vue",
    "app/components/mobileKey/AccessPointScanEvidence.vue",
  ])("keeps the z-10 of %s below the bar", (file) => {
    const path = pathTo(templateOf(file), (node) =>
      classesOf(node).includes("z-10"),
    );

    expect(path).not.toBeNull();
    expect(isolatedAbove(path!)).toBe(true);
  });
});

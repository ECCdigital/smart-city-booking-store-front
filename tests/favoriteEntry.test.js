import { describe, expect, it } from "vitest";

import {
  ALL_TENANTS,
  detailPathOf,
  filterByTenant,
  isAvailable,
  offerOf,
  stillMarked,
  tenantsOf,
  titleOf,
} from "~/composables/favorites/favoriteEntry.js";
import { favoriteKey } from "~/composables/favorites/favoriteReference.js";

const entry = (overrides = {}) => ({
  tenantId: "default",
  tenantName: "Stadt",
  targetType: "bookable",
  targetId: "b-1",
  title: "Großer Saal (damals)",
  created: "2026-10-01T00:00:00Z",
  status: "available",
  offer: { id: "b-1", tenantId: "default", type: "room", title: "Großer Saal" },
  ...overrides,
});

describe("an entry of the favorites list", () => {
  it("is available only with the offer in its public projection", () => {
    expect(isAvailable(entry())).toBe(true);
    expect(isAvailable(entry({ status: "unavailable", offer: undefined }))).toBe(false);
    expect(isAvailable(entry({ status: "deleted", offer: undefined }))).toBe(false);
  });

  it("hands the offer over as the catalog reads it, an event with its Kind", () => {
    expect(offerOf(entry())).toEqual({
      id: "b-1",
      tenantId: "default",
      type: "room",
      title: "Großer Saal",
    });

    const event = entry({
      targetType: "event",
      targetId: "e-1",
      offer: { id: "e-1", information: { name: "Stadtfest" } },
    });
    expect(offerOf(event)).toEqual({
      id: "e-1",
      tenantId: "default",
      type: "event",
      information: { name: "Stadtfest" },
    });
    expect(offerOf(entry({ status: "deleted", offer: undefined }))).toBeNull();
  });

  it("shows the current title while available and the snapshot otherwise", () => {
    expect(titleOf(entry())).toBe("Großer Saal");
    expect(
      titleOf(
        entry({
          targetType: "event",
          offer: { id: "e-1", information: { name: "Stadtfest" } },
        }),
      ),
    ).toBe("Stadtfest");
    expect(titleOf(entry({ status: "unavailable", offer: undefined }))).toBe(
      "Großer Saal (damals)",
    );
  });

  it("leads to the detail view of its Kind", () => {
    expect(detailPathOf(entry())).toBe("/bookables/b-1");
    expect(detailPathOf(entry({ targetType: "event", targetId: "e 1" }))).toBe(
      "/events/e%201",
    );
  });
});

describe("the tenant filter of the favorites page", () => {
  const entries = [
    entry(),
    entry({ targetId: "b-2", tenantId: "sports", tenantName: "Sportamt" }),
    entry({ targetId: "b-3" }),
  ];

  it("lists each tenant once, named from the snapshot", () => {
    expect(tenantsOf(entries)).toEqual([
      { id: "default", name: "Stadt" },
      { id: "sports", name: "Sportamt" },
    ]);
    expect(tenantsOf([entry({ tenantName: "" })])).toEqual([
      { id: "default", name: "default" },
    ]);
  });

  it("narrows to one tenant and to none", () => {
    expect(filterByTenant(entries, "sports").map((e) => e.targetId)).toEqual(["b-2"]);
    expect(filterByTenant(entries, ALL_TENANTS)).toHaveLength(3);
    expect(filterByTenant(entries, null)).toHaveLength(3);
  });
});

describe("the entries still marked", () => {
  const entries = [entry(), entry({ targetId: "b-2" })];

  it("drops what the store no longer holds", () => {
    const keys = new Set([favoriteKey(entries[0])]);
    expect(stillMarked(entries, keys).map((e) => e.targetId)).toEqual(["b-1"]);
  });

  it("shows the loaded list as it is while the references are unknown", () => {
    expect(stillMarked(entries, new Set(), false)).toHaveLength(2);
  });
});

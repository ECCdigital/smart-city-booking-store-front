import { describe, expect, it } from "vitest";

import {
  detailPathOf,
  filterEntries,
  isAvailable,
  kindOf,
  kindsOf,
  offerOf,
  searchByTitle,
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

describe("the filter of the favorites page", () => {
  const entries = [
    entry(),
    entry({
      targetId: "b-2",
      tenantId: "sports",
      tenantName: "Sportamt",
      offer: { id: "b-2", type: "resource", title: "Ball" },
    }),
    entry({ targetId: "b-3", status: "deleted", offer: undefined }),
    entry({
      targetType: "event",
      targetId: "e-1",
      status: "unavailable",
      offer: undefined,
    }),
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

  it("knows the Kind of an available bookable and of every event", () => {
    expect(kindOf(entries[0])).toBe("room");
    expect(kindOf(entries[1])).toBe("resource");
    expect(kindOf(entries[2])).toBeNull();
    expect(kindOf(entries[3])).toBe("event");
  });

  it("lists the Kinds present in the catalog's order", () => {
    expect(kindsOf(entries)).toEqual(["room", "resource", "event"]);
    expect(kindsOf([])).toEqual([]);
  });

  it("narrows by providers, by Kinds, by both, and by nothing", () => {
    const ids = (list) => list.map((e) => e.targetId);

    expect(ids(filterEntries(entries, { tenantIds: ["sports"] }))).toEqual(["b-2"]);
    expect(ids(filterEntries(entries, { kinds: ["room", "event"] }))).toEqual([
      "b-1",
      "e-1",
    ]);
    expect(
      ids(filterEntries(entries, { tenantIds: ["default"], kinds: ["event"] })),
    ).toEqual(["e-1"]);
    expect(filterEntries(entries, {})).toHaveLength(4);
    expect(filterEntries(entries)).toHaveLength(4);
  });

  it("keeps a bookable without a Kind out of a Kind choice", () => {
    expect(filterEntries(entries, { kinds: ["room"] })).not.toContain(entries[2]);
    expect(filterEntries(entries, { tenantIds: ["default"] })).toContain(entries[2]);
  });
});

describe("the title search of the favorites page", () => {
  const entries = [
    entry(),
    entry({ targetId: "b-2", status: "deleted", offer: undefined, title: "Nähmaschine" }),
    entry({
      targetType: "event",
      targetId: "e-1",
      offer: { id: "e-1", information: { name: "Stadtfest" } },
    }),
  ];

  it("finds a title by a part of it, whatever the case and accents", () => {
    expect(searchByTitle(entries, "saal").map((e) => e.targetId)).toEqual(["b-1"]);
    expect(searchByTitle(entries, "nahm").map((e) => e.targetId)).toEqual(["b-2"]);
    expect(searchByTitle(entries, "FEST").map((e) => e.targetId)).toEqual(["e-1"]);
  });

  it("reads the current title of an available entry, not the snapshot", () => {
    expect(searchByTitle(entries, "damals")).toEqual([]);
  });

  it("keeps everything for an empty or blank query", () => {
    expect(searchByTitle(entries, "")).toHaveLength(3);
    expect(searchByTitle(entries, "   ")).toHaveLength(3);
    expect(searchByTitle(entries, undefined)).toHaveLength(3);
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

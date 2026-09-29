import { describe, expect, it } from "vitest";

import {
  applyCatalogFilters,
  MatchStatus,
  type CatalogFilterCriteria,
  type FilterableItem,
} from "~/composables/search/catalogFilters";

interface Wrapper extends FilterableItem {
  item: FilterableItem["item"] & {
    price: number;
    customFieldValues?: { fieldId: string; value: unknown }[];
  };
}

const SIZE_FIELD = {
  id: "size",
  inputType: "select",
  options: [{ value: "s" }, { value: "l" }],
  usageOptions: { catalogFilterType: "select" },
};

function wrap(
  id: string,
  {
    city,
    type = "room",
    tenant = "t1",
    price,
    distanceKm,
    status = MatchStatus.MATCH,
    size,
  }: {
    city: string;
    type?: string;
    tenant?: string;
    price: number;
    distanceKm?: number;
    status?: string;
    size?: string;
  },
): Wrapper {
  return {
    matchStatus: status,
    item: {
      id,
      tenantId: tenant,
      type,
      price,
      location: { address: { city } },
      distanceMeter: distanceKm === undefined ? undefined : distanceKm * 1000,
      customFields: [SIZE_FIELD],
      customFieldValues: size ? [{ fieldId: "size", value: size }] : [],
    },
  };
}

const ITEMS: Wrapper[] = [
  wrap("a", { city: "Bad Homburg", price: 10, distanceKm: 2, size: "s" }),
  wrap("b", { city: "Bad Homburg", price: 40, distanceKm: 8, size: "l" }),
  wrap("c", { city: "Frankfurt", price: 20, distanceKm: 20, size: "s" }),
  wrap("d", {
    city: "Frankfurt",
    type: "resource",
    tenant: "t2",
    price: 60,
    distanceKm: 25,
  }),
  wrap("e", {
    city: "Oberursel",
    price: 5,
    distanceKm: 4,
    status: MatchStatus.NO_MATCH,
  }),
];

const NONE: CatalogFilterCriteria = {
  inclNoSuitable: false,
  pubEv: false,
  regEv: false,
  cat: [],
  cities: [],
  tenants: [],
  distance: null,
  hasLocation: false,
  price: [],
  customFields: {},
};

const OPTIONS = {
  getMinPrice: (w: Wrapper) =>
    w.matchStatus === MatchStatus.NO_MATCH ? null : w.item.price,
};

function matches(criteria: Partial<CatalogFilterCriteria>, skip?: string) {
  return applyCatalogFilters(ITEMS, { ...NONE, ...criteria }, {
    ...OPTIONS,
    skip: skip as never,
  })
    .filter((w) => w.matchStatus === MatchStatus.MATCH)
    .map((w) => w.item.id);
}

describe("applyCatalogFilters", () => {
  it("returns every item with its status and mutates none of them", () => {
    const result = applyCatalogFilters(ITEMS, NONE, OPTIONS);

    expect(result.map((w) => w.item.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(result.map((w) => w.matchStatus)).toEqual([
      "match",
      "match",
      "match",
      "match",
      "no-match",
    ]);
    expect(ITEMS.map((w) => w.matchStatus)).toEqual([
      "match",
      "match",
      "match",
      "match",
      "no-match",
    ]);
  });

  it("combines the filters like the result list did", () => {
    expect(matches({ cities: ["frankfurt"] })).toEqual(["c", "d"]);
    expect(matches({ cities: ["frankfurt"], cat: ["room"] })).toEqual(["c"]);
    expect(matches({ price: [15, 45] })).toEqual(["b", "c"]);
    expect(matches({ customFields: { size: ["s"] } })).toEqual(["a", "c"]);
    expect(matches({ tenants: ["t2"] })).toEqual(["d"]);
  });

  it("narrows only the events by the event switches and custom fields", () => {
    const event = (id: string, attendees: object): Wrapper => ({
      matchStatus: MatchStatus.MATCH,
      item: {
        id,
        type: "event",
        price: 0,
        location: { address: { city: "Frankfurt" } },
        attendees,
      },
    });
    const mixed = [
      ...ITEMS,
      event("pub", { publicEvent: true, needsRegistration: false }),
      event("reg", { publicEvent: false, needsRegistration: true }),
    ];
    const ids = (criteria: Partial<CatalogFilterCriteria>) =>
      applyCatalogFilters(mixed, { ...NONE, ...criteria }, OPTIONS)
        .filter((w) => w.matchStatus === MatchStatus.MATCH)
        .map((w) => w.item.id);

    expect(ids({ pubEv: true })).toEqual(["a", "b", "c", "d", "pub"]);
    expect(ids({ regEv: true })).toEqual(["a", "b", "c", "d", "reg"]);
    expect(ids({ customFields: { size: ["s"] } })).toEqual([
      "a",
      "c",
      "pub",
      "reg",
    ]);
    expect(ids({ cat: ["event"] })).toEqual(["pub", "reg"]);
  });

  it("marks items beyond the distance too-far without touching the source", () => {
    const result = applyCatalogFilters(
      ITEMS,
      { ...NONE, hasLocation: true, distance: 10 },
      OPTIONS,
    );

    expect(result.map((w) => w.matchStatus)).toEqual([
      "match",
      "match",
      "too-far",
      "too-far",
      "no-match",
    ]);
    expect(ITEMS[2]?.matchStatus).toBe("match");
  });

  it("brings an item the search flagged too-far back once the distance grows", () => {
    const far = ITEMS.map((w) =>
      w.item.id === "c" ? { ...w, matchStatus: MatchStatus.TOO_FAR } : w,
    );

    const narrow = applyCatalogFilters(
      far,
      { ...NONE, hasLocation: true, distance: 10 },
      OPTIONS,
    );
    expect(narrow[2]?.matchStatus).toBe("too-far");

    const wide = applyCatalogFilters(
      far,
      { ...NONE, hasLocation: true, distance: 30 },
      OPTIONS,
    );
    expect(wide[2]?.matchStatus).toBe("match");
    // The price filter sees the restored status, so the item gets its price.
    expect(
      applyCatalogFilters(
        far,
        { ...NONE, hasLocation: true, distance: 30, price: [15, 25] },
        OPTIONS,
      ).map((w) => w.matchStatus),
    ).toEqual(["no-match", "no-match", "match", "no-match", "no-match"]);
  });

  describe("skip, for facet counts", () => {
    const CRITERIA: Partial<CatalogFilterCriteria> = {
      cities: ["bad homburg"],
      price: [15, 100],
    };

    it("leaves the other cities counted when one is chosen", () => {
      // With the city filter applied only Bad Homburg would remain.
      expect(matches(CRITERIA)).toEqual(["b"]);
      // The city facet ignores the city filter and keeps the price filter.
      expect(matches(CRITERIA, "cities")).toEqual(["b", "c", "d"]);
    });

    it("holds the price histogram still while the price moves", () => {
      expect(matches(CRITERIA, "price")).toEqual(["a", "b"]);
      expect(matches({ ...CRITERIA, price: [30, 100] }, "price")).toEqual([
        "a",
        "b",
      ]);
    });

    it("skips only the named custom field", () => {
      const criteria = { customFields: { size: ["l"] }, cat: ["room"] };
      expect(matches(criteria)).toEqual(["b"]);
      expect(matches(criteria, "cf:size")).toEqual(["a", "b", "c"]);
      expect(matches(criteria, "cf:other")).toEqual(["b"]);
    });

    it("skips the tenants for the provider facet", () => {
      const criteria = { tenants: ["t2"], cat: ["room", "resource"] };
      expect(matches(criteria)).toEqual(["d"]);
      expect(matches(criteria, "tenants")).toEqual(["a", "b", "c", "d"]);
    });

    it("skips the distance for the distance histogram", () => {
      const criteria = { hasLocation: true, distance: 5, cat: ["room"] };
      expect(matches(criteria)).toEqual(["a"]);
      expect(matches(criteria, "distance")).toEqual(["a", "b", "c"]);
    });
  });
});

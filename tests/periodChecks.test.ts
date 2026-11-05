import { describe, expect, it } from "vitest";

import { MatchStatus } from "~/composables/search/catalogFilters";
import {
  createRequestCache,
  idsToCheck,
  mapWithConcurrency,
  narrowingKey,
  periodBatches,
  type NarrowingCriteria,
} from "~/composables/search/periodChecks";

const NO_FILTERS: NarrowingCriteria = {
  pubEv: false,
  regEv: false,
  cat: [],
  cities: [],
  tenants: [],
  customFields: {},
};

function wrap(id: string, tenantId: string, type = "room") {
  return { item: { id, tenantId, type }, matchStatus: MatchStatus.MATCH };
}

describe("mapWithConcurrency", () => {
  it("never runs more than the limit at once and keeps the order", async () => {
    let running = 0;
    let peak = 0;
    const results = await mapWithConcurrency(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      3,
      async (n) => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 1));
        running--;
        return n * 2;
      },
    );

    expect(peak).toBe(3);
    expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  });

  it("leaves a rejected call undefined and runs the others", async () => {
    const results = await mapWithConcurrency([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error("429");
      return n;
    });

    expect(results).toEqual([1, undefined, 3]);
  });

  it("returns an empty list for no items", async () => {
    expect(await mapWithConcurrency([], 6, async () => 1)).toEqual([]);
  });
});

describe("idsToCheck", () => {
  const items = [
    wrap("a", "test"),
    wrap("b", "test", "resource"),
    wrap("c", "diz"),
    wrap("d", "niesspuk"),
  ];

  it("keeps every Offer without filters", () => {
    expect(idsToCheck(items, NO_FILTERS)).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("keeps only the chosen tenant's Offers", () => {
    expect(idsToCheck(items, { ...NO_FILTERS, tenants: ["test"] })).toEqual(
      new Set(["a", "b"]),
    );
  });

  it("narrows by tenant and category together", () => {
    expect(
      idsToCheck(items, { ...NO_FILTERS, tenants: ["test"], cat: ["room"] }),
    ).toEqual(new Set(["a"]));
  });
});

describe("narrowingKey", () => {
  it("ignores the order of chosen values", () => {
    expect(narrowingKey({ ...NO_FILTERS, tenants: ["a", "b"] })).toBe(
      narrowingKey({ ...NO_FILTERS, tenants: ["b", "a"] }),
    );
  });

  it("changes with the tenants", () => {
    expect(narrowingKey({ ...NO_FILTERS, tenants: ["a"] })).not.toBe(
      narrowingKey({ ...NO_FILTERS, tenants: ["a", "b"] }),
    );
  });
});

describe("periodBatches", () => {
  it("asks once per tenant", () => {
    expect(
      periodBatches([
        { id: "a", tenantId: "test" },
        { id: "c", tenantId: "diz" },
        { id: "b", tenantId: "test" },
      ]),
    ).toEqual([
      { tenantId: "test", ids: ["a", "b"] },
      { tenantId: "diz", ids: ["c"] },
    ]);
  });

  it("splits a tenant with more bookables than one request takes", () => {
    const items = ["a", "b", "c", "d", "e"].map((id) => ({
      id,
      tenantId: "t",
    }));

    expect(periodBatches(items, 2)).toEqual([
      { tenantId: "t", ids: ["a", "b"] },
      { tenantId: "t", ids: ["c", "d"] },
      { tenantId: "t", ids: ["e"] },
    ]);
  });

  it("asks for a bookable once", () => {
    expect(
      periodBatches([
        { id: "a", tenantId: "t" },
        { id: "a", tenantId: "t" },
      ]),
    ).toEqual([{ tenantId: "t", ids: ["a"] }]);
  });
});

describe("createRequestCache", () => {
  it("asks once per key", async () => {
    const cached = createRequestCache();
    let calls = 0;
    const request = async () => ++calls;

    expect(cached.has("k")).toBe(false);
    await cached("k", request);
    await cached("k", request);

    expect(calls).toBe(1);
    expect(cached.has("k")).toBe(true);
  });

  it("forgets a failed request", async () => {
    const cached = createRequestCache();
    let calls = 0;

    await expect(
      cached("k", async () => {
        calls++;
        throw new Error("429");
      }),
    ).rejects.toThrow("429");
    expect(await cached("k", async () => ++calls)).toBe(2);
  });
});

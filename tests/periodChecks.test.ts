import { describe, expect, it } from "vitest";

import { MatchStatus } from "~/composables/search/catalogFilters";
import {
  availabilityOf,
  createRequestCache,
  createRunGuard,
  idsToCheck,
  isMissingPeriodRoute,
  locationForRerun,
  mapWithConcurrency,
  narrowingKey,
  periodBatches,
  periodResultOf,
  type NarrowingCriteria,
} from "~/composables/search/periodChecks";

const NO_FILTERS: NarrowingCriteria = {
  pubEv: false,
  regEv: false,
  cat: [],
  cities: [],
  tenants: [],
  customFields: {},
  distance: null,
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

  it("changes with the radius, so a wider one checks the Offers it adds", () => {
    expect(narrowingKey({ ...NO_FILTERS, distance: 20 })).not.toBe(
      narrowingKey({ ...NO_FILTERS, distance: 30 }),
    );
    expect(narrowingKey({ ...NO_FILTERS, distance: null })).not.toBe(
      narrowingKey({ ...NO_FILTERS, distance: 30 }),
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

describe("isMissingPeriodRoute", () => {
  it("is a backend without the route: 404 or 405 with its plain page", () => {
    const page = "<pre>Cannot POST /api/test/bookables/occupancy</pre>";
    expect(isMissingPeriodRoute({ statusCode: 404, data: page })).toBe(true);
    expect(isMissingPeriodRoute({ statusCode: 405 })).toBe(true);
  });

  it("is not a backend error with a code, such as tenant_not_found", () => {
    expect(
      isMissingPeriodRoute({
        statusCode: 404,
        data: { error: "NotFoundError", code: "tenant_not_found" },
      }),
    ).toBe(false);
  });

  it("is not a rate limit or any other failure: those must not fan out", () => {
    for (const statusCode of [429, 400, 500, 502, 503]) {
      expect(isMissingPeriodRoute({ statusCode })).toBe(false);
    }
    expect(isMissingPeriodRoute(undefined)).toBe(false);
    expect(isMissingPeriodRoute(new Error("network"))).toBe(false);
  });
});

describe("periodResultOf", () => {
  const PRICE = { userGrossPriceEur: 23.8 };

  it("keeps availability and price of an available bookable", () => {
    expect(
      periodResultOf({ bookableId: "a", isAvailable: true, price: PRICE }),
    ).toEqual({ isAvailable: true, price: PRICE });
  });

  it("drops a refused bookable", () => {
    expect(
      periodResultOf({
        bookableId: "a",
        isAvailable: false,
        reason: "opening-hours",
        price: null,
      }),
    ).toEqual({ isAvailable: false, price: null });
  });

  it("leaves a bookable whose checks could not run unknown, not free", () => {
    expect(
      periodResultOf({
        bookableId: "a",
        isAvailable: false,
        reason: "error",
        price: null,
      }),
    ).toEqual({ isAvailable: null, price: null });
  });

  it("drops a bookable the answer leaves out", () => {
    expect(periodResultOf(undefined)).toEqual({
      isAvailable: false,
      price: null,
    });
  });
});

describe("locationForRerun", () => {
  const BREMEN = {
    display_address: "Bremen, Deutschland",
    coordinates: { points: [8.8, 53.08] as [number, number] },
  };

  it("keeps the chosen place with its coordinates while the query names it", () => {
    expect(locationForRerun(BREMEN, "Bremen, Deutschland")).toBe(BREMEN);
  });

  it("takes the query's text once the place changed or was cleared", () => {
    expect(locationForRerun(BREMEN, "Hamburg")).toBe("Hamburg");
    expect(locationForRerun(BREMEN, "")).toBe("");
  });

  it("takes the query's text where the last run searched by text or not at all", () => {
    expect(locationForRerun("Bremen", "Bremen")).toBe("Bremen");
    expect(locationForRerun(null, "Bremen")).toBe("Bremen");
  });
});

describe("availabilityOf", () => {
  it("tells available from booked", () => {
    expect(availabilityOf(true)).toBe("available");
    expect(availabilityOf(false)).toBe("unavailable");
  });

  it("calls a failed or unknown check unchecked, never available", () => {
    expect(availabilityOf(undefined)).toBe("unchecked");
    expect(availabilityOf(null)).toBe("unchecked");
  });
});

describe("createRunGuard", () => {
  it("lets only the latest run write", () => {
    const runs = createRunGuard();
    const first = runs.start();
    const second = runs.start();

    expect(runs.isCurrent(first)).toBe(false);
    expect(runs.isCurrent(second)).toBe(true);
  });

  it("outdates a running search on a reset, so it cannot bring its period back", () => {
    const runs = createRunGuard();
    const run = runs.start();

    runs.invalidate();

    expect(runs.isCurrent(run)).toBe(false);
  });

  it("lets a run started after a reset write", () => {
    const runs = createRunGuard();
    runs.start();
    runs.invalidate();
    const run = runs.start();

    expect(runs.isCurrent(run)).toBe(true);
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

  it("shares a request on its way: a second search waits instead of asking again", async () => {
    const cached = createRequestCache();
    let calls = 0;
    let release!: (n: number) => void;
    const request = () => {
      calls++;
      return new Promise<number>((resolve) => (release = resolve));
    };

    const first = cached("k", request);
    expect(cached.has("k")).toBe(true);
    const second = cached("k", request);
    release(7);

    expect(await first).toBe(7);
    expect(await second).toBe(7);
    expect(calls).toBe(1);
  });

  it("forgets an answer once it is older than the ttl", async () => {
    let clock = 0;
    const cached = createRequestCache({ ttlMs: 60_000, now: () => clock });
    let calls = 0;
    const request = async () => ++calls;

    await cached("k", request);
    clock = 59_999;
    expect(cached.has("k")).toBe(true);
    await cached("k", request);
    clock = 60_000;
    expect(cached.has("k")).toBe(false);
    await cached("k", request);

    expect(calls).toBe(2);
  });

  it("keeps a newer answer when an expired request fails late", async () => {
    let clock = 0;
    const cached = createRequestCache({ ttlMs: 10, now: () => clock });
    let fail!: (e: Error) => void;
    const old = cached(
      "k",
      () => new Promise<number>((_, reject) => (fail = reject)),
    ).catch(() => "failed");

    clock = 10;
    expect(await cached("k", async () => 2)).toBe(2);
    fail(new Error("late"));
    expect(await old).toBe("failed");

    expect(cached.has("k")).toBe(true);
  });
});

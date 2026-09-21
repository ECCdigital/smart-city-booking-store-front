import { describe, expect, it } from "vitest";

import {
  detailCandidateTenants,
  resolveDetail,
  tenantMustBeListed,
  type DetailFetch,
} from "~~/server/api/utils/detailResolution";

/**
 * A direct link loads its offer independently of the catalog list: the BFF
 * asks the backend for the offer in every tenant that can hold it and lets
 * the backend decide. These tests drive the resolution through an injected
 * fetcher, so nothing here talks to a backend.
 */

/** A backend that answers the given paths and 404s everything else. */
function backend(answers: Record<string, unknown>) {
  const asked: string[] = [];
  const fetch: DetailFetch = async (path) => {
    asked.push(path);
    return path in answers
      ? { data: answers[path], error: null }
      : { data: null, error: { status: 404, message: "Not Found" } };
  };
  return { fetch, asked };
}

describe("the tenants a direct link is asked in", () => {
  it("is the tenant of a single-tenant catalog", () => {
    expect(
      detailCandidateTenants({
        catalogTenantId: "solo",
        listedTenantIds: ["a"],
      }),
    ).toEqual(["solo"]);
  });

  it("is every listed tenant of an instance catalog", () => {
    expect(detailCandidateTenants({ listedTenantIds: ["a", "b"] })).toEqual([
      "a",
      "b",
    ]);
  });

  it("adds the tenant a link names, once, without dropping the listed ones", () => {
    expect(
      detailCandidateTenants({ listedTenantIds: ["a", "b"], tenantHint: "c" }),
    ).toEqual(["a", "b", "c"]);
    expect(
      detailCandidateTenants({ listedTenantIds: ["a", "b"], tenantHint: "a" }),
    ).toEqual(["a", "b"]);
  });
});

describe("the tenant page of a tenant the catalog does not list", () => {
  it("is not found for a list request", () => {
    expect(tenantMustBeListed({})).toBe(true);
  });

  it("is left to the backend for a direct link to one bookable or event", () => {
    expect(tenantMustBeListed({ bookableId: "room" })).toBe(false);
    expect(tenantMustBeListed({ eventId: "fair" })).toBe(false);
  });
});

describe("resolving a bookable direct link", () => {
  it("takes a listed bookable as the catalog interface delivers it", async () => {
    const listed = { id: "room", tenantId: "a", checkoutUrl: "https://x" };
    const { fetch, asked } = backend({ "/json/a/bookables/room": listed });

    const hit = await resolveDetail({
      kind: "bookable",
      id: "room",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit).toEqual({ tenantId: "a", item: listed });
    expect(asked).toEqual(["/json/a/bookables/room"]);
  });

  it("finds an unlisted bookable over the direct-link route of its tenant", async () => {
    const related = { id: "beamer", tenantId: "a" };
    const { fetch } = backend({
      "/api/a/bookables/public/room?populate=true": {
        id: "room",
        tenantId: "a",
        title: "Room",
        _populated: { event: null, relatedBookables: [related] },
      },
    });

    const hit = await resolveDetail({
      kind: "bookable",
      id: "room",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit).toEqual({
      tenantId: "a",
      item: {
        id: "room",
        tenantId: "a",
        title: "Room",
        relatedBookables: [related],
      },
    });
  });

  it("finds the bookable in whichever candidate tenant holds it", async () => {
    const { fetch } = backend({
      "/json/b/bookables/room": { id: "room", tenantId: "b" },
    });

    const hit = await resolveDetail({
      kind: "bookable",
      id: "room",
      tenantIds: ["a", "b"],
      fetch,
    });

    expect(hit?.tenantId).toBe("b");
  });

  it("answers null when the backend delivers it for no tenant", async () => {
    const { fetch, asked } = backend({});

    const hit = await resolveDetail({
      kind: "bookable",
      id: "gone",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit).toBeNull();
    expect(asked).toEqual([
      "/json/a/bookables/gone",
      "/api/a/bookables/public/gone?populate=true",
    ]);
  });

  it("answers null without candidates", async () => {
    const { fetch, asked } = backend({});

    expect(
      await resolveDetail({ kind: "bookable", id: "x", tenantIds: [], fetch }),
    ).toBeNull();
    expect(asked).toEqual([]);
  });
});

describe("resolving an event direct link", () => {
  it("takes a listed event with its tickets", async () => {
    const listed = { id: "fair", tenantId: "a", tickets: [{ id: "t1" }] };
    const { fetch } = backend({ "/json/a/events/fair": listed });

    const hit = await resolveDetail({
      kind: "event",
      id: "fair",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit).toEqual({ tenantId: "a", item: listed });
  });

  it("finds an unlisted event over the direct-link route, in the shape the detail page reads", async () => {
    const { fetch } = backend({
      "/api/a/events/fair": {
        id: "fair",
        tenantId: "a",
        information: {
          name: "Fair",
          teaserImage: { source: "external", mediaId: null, url: "https://img/t.png" },
        },
        images: [
          "https://img/legacy.png",
          { source: "media", mediaId: "m1", url: null },
        ],
        eventOrganizer: {
          name: "Org",
          contactPersonImage: null,
          speakers: [{ name: "S", image: { source: "external", url: "https://img/s.png" } }],
        },
      },
    });

    const hit = await resolveDetail({
      kind: "event",
      id: "fair",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit?.item).toEqual({
      id: "fair",
      tenantId: "a",
      information: { name: "Fair", teaserImage: "https://img/t.png" },
      images: ["https://img/legacy.png", ""],
      eventOrganizer: {
        name: "Org",
        contactPersonImage: "",
        speakers: [{ name: "S", image: "https://img/s.png" }],
      },
      tickets: [],
    });
  });

  it("treats the empty answer of the direct-link route as a miss", async () => {
    const { fetch } = backend({ "/api/a/events/gone": "" });

    expect(
      await resolveDetail({ kind: "event", id: "gone", tenantIds: ["a"], fetch }),
    ).toBeNull();
  });
});

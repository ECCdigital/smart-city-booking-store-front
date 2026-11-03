import { describe, expect, it } from "vitest";

import {
  detailCandidateTenants,
  resolveDetail,
  tenantMustBeListed,
  type DetailFetch,
} from "~~/server/api/utils/detailResolution";

/**
 * A direct link loads its offer independently of the catalog list: the BFF
 * asks the backend for the offer in every tenant that can hold it. The
 * backend decides whether the public reaches it; the detail page shows only
 * what also asks to be listed (`isPublic`), an `unlisted` offer is reached
 * by its checkout alone (ECCdigital/tickets#225). These tests drive the
 * resolution through an injected fetcher, so nothing here talks to a
 * backend.
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
    const { fetch, asked } = backend({
      "/json/a/bookables/room": listed,
      "/api/a/bookables/public/room?populate=true": {
        id: "room",
        tenantId: "a",
        isPublic: true,
      },
    });

    const hit = await resolveDetail({
      kind: "bookable",
      id: "room",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit).toEqual({ tenantId: "a", item: listed });
    expect(asked).toEqual([
      "/json/a/bookables/room",
      "/api/a/bookables/public/room?populate=true",
    ]);
  });

  it("does not show an unlisted bookable, though the backend delivers it", async () => {
    const { fetch } = backend({
      "/json/a/bookables/room": { id: "room", tenantId: "a" },
      "/api/a/bookables/public/room?populate=true": {
        id: "room",
        tenantId: "a",
        isPublic: false,
      },
    });

    expect(
      await resolveDetail({ kind: "bookable", id: "room", tenantIds: ["a"], fetch }),
    ).toBeNull();
  });

  it("does not show a bookable whose wish to be listed is unknown", async () => {
    const { fetch } = backend({
      "/json/a/bookables/room": { id: "room", tenantId: "a" },
      "/api/a/bookables/public/room?populate=true": { id: "room", tenantId: "a" },
    });

    expect(
      await resolveDetail({ kind: "bookable", id: "room", tenantIds: ["a"], fetch }),
    ).toBeNull();
  });

  it("finds a listed bookable the catalog interface refuses over the direct-link route", async () => {
    const related = { id: "beamer", tenantId: "a" };
    const { fetch } = backend({
      "/api/a/bookables/public/room?populate=true": {
        id: "room",
        tenantId: "a",
        title: "Room",
        isPublic: true,
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
        isPublic: true,
        relatedBookables: [related],
      },
    });
  });

  it("finds the bookable in whichever candidate tenant holds it", async () => {
    const { fetch } = backend({
      "/json/b/bookables/room": { id: "room", tenantId: "b" },
      "/api/b/bookables/public/room?populate=true": {
        id: "room",
        tenantId: "b",
        isPublic: true,
      },
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

  it("surfaces an infrastructure error instead of calling the bookable not available", async () => {
    // Tenant `a` answers 404 on both routes, the backend fails for tenant `b`.
    const fetch: DetailFetch = async (path) =>
      path.includes("/b/")
        ? { data: null, error: { status: 502, message: "Backend unreachable" } }
        : { data: null, error: { status: 404, message: "Not Found" } };

    await expect(
      resolveDetail({ kind: "bookable", id: "court", tenantIds: ["a", "b"], fetch }),
    ).rejects.toMatchObject({ upstream: { status: 502 } });
  });

  it("surfaces a failing direct-link route instead of guessing whether the bookable is listed", async () => {
    const fetch: DetailFetch = async (path) =>
      path === "/json/a/bookables/court"
        ? { data: { id: "court", tenantId: "a" }, error: null }
        : { data: null, error: { status: 503, message: "Service Unavailable" } };

    await expect(
      resolveDetail({ kind: "bookable", id: "court", tenantIds: ["a"], fetch }),
    ).rejects.toMatchObject({ upstream: { status: 503 } });
  });

  it("still delivers a bookable one tenant holds while another tenant fails", async () => {
    const fetch: DetailFetch = async (path) => {
      if (path === "/json/a/bookables/court") {
        return { data: { id: "court", tenantId: "a" }, error: null };
      }
      if (path === "/api/a/bookables/public/court?populate=true") {
        return { data: { id: "court", tenantId: "a", isPublic: true }, error: null };
      }
      return { data: null, error: { status: 500, message: "Internal Server Error" } };
    };

    const hit = await resolveDetail({
      kind: "bookable",
      id: "court",
      tenantIds: ["a", "b"],
      fetch,
    });

    expect(hit?.tenantId).toBe("a");
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
    const { fetch } = backend({
      "/json/a/events/fair": listed,
      "/api/a/events/fair": { id: "fair", tenantId: "a", isPublic: true },
    });

    const hit = await resolveDetail({
      kind: "event",
      id: "fair",
      tenantIds: ["a"],
      fetch,
    });

    expect(hit).toEqual({ tenantId: "a", item: listed });
  });

  it("does not show an unlisted event, though the backend delivers it", async () => {
    const { fetch } = backend({
      "/json/a/events/fair": { id: "fair", tenantId: "a", tickets: [] },
      "/api/a/events/fair": { id: "fair", tenantId: "a", isPublic: false },
    });

    expect(
      await resolveDetail({ kind: "event", id: "fair", tenantIds: ["a"], fetch }),
    ).toBeNull();
  });

  it("finds a listed event the catalog interface refuses over the direct-link route, in the shape the detail page reads", async () => {
    const { fetch } = backend({
      "/api/a/events/fair": {
        id: "fair",
        tenantId: "a",
        isPublic: true,
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
      isPublic: true,
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

  it("surfaces a backend that fails instead of calling the event not available", async () => {
    const fetch: DetailFetch = async () => ({
      data: null,
      error: { status: 503, message: "Service Unavailable" },
    });

    await expect(
      resolveDetail({ kind: "event", id: "fair", tenantIds: ["a"], fetch }),
    ).rejects.toMatchObject({ upstream: { status: 503 } });
  });

  it("treats the empty answer of the direct-link route as a miss", async () => {
    const { fetch } = backend({ "/api/a/events/gone": "" });

    expect(
      await resolveDetail({ kind: "event", id: "gone", tenantIds: ["a"], fetch }),
    ).toBeNull();
  });
});

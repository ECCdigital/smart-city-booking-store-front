import { describe, expect, it } from "vitest";

import {
  isNotAvailableError,
  missingTenantIdOf,
  shouldLoadDetail,
  tenantHintOf,
} from "~/utils/catalogDetail.js";

describe("whether a detail page asks the backend for its offer", () => {
  it("asks on a cold direct link, for an event as for a bookable", () => {
    expect(shouldLoadDetail({ detailId: "fair", loadedDetailIds: [] })).toBe(
      true,
    );
    expect(
      shouldLoadDetail({ detailId: "fair", loadedDetailIds: undefined }),
    ).toBe(true);
  });

  it("asks even when a list bundle already put other offers into the store", () => {
    // Only a detail load counts: `loadedDetailIds` never holds list items.
    expect(
      shouldLoadDetail({ detailId: "room", loadedDetailIds: ["other"] }),
    ).toBe(true);
  });

  it("does not ask again for a detail it already loaded, unless forced", () => {
    expect(
      shouldLoadDetail({ detailId: "room", loadedDetailIds: ["room"] }),
    ).toBe(false);
    expect(
      shouldLoadDetail({
        detailId: "room",
        loadedDetailIds: ["room"],
        force: true,
      }),
    ).toBe(true);
  });
});

describe("the tenant a direct link names", () => {
  it("is the `tenantId` of the query", () => {
    expect(tenantHintOf({ tenantId: "a" })).toBe("a");
  });

  it("is the first of a repeated parameter", () => {
    expect(tenantHintOf({ tenantId: ["a", "b"] })).toBe("a");
  });

  it("is null when the link names none", () => {
    expect(tenantHintOf({})).toBeNull();
    expect(tenantHintOf({ tenantId: "" })).toBeNull();
    expect(tenantHintOf(undefined)).toBeNull();
  });
});

describe("the tenant information a resolved offer still needs", () => {
  const listed = [{ id: "a", name: "A" }];

  it("is nothing for an offer of a listed tenant", () => {
    expect(missingTenantIdOf({ id: "room", tenantId: "a" }, listed)).toBeNull();
  });

  it("is the tenant of an offer whose tenant the catalog does not list", () => {
    expect(missingTenantIdOf({ id: "room", tenantId: "z" }, listed)).toBe("z");
  });

  it("is nothing for a miss: no offer, nothing to look up", () => {
    expect(missingTenantIdOf(undefined, listed)).toBeNull();
    expect(missingTenantIdOf(null, listed)).toBeNull();
  });
});

/**
 * An offer the backend does not deliver is "not available" — never existed,
 * withdrawn or of a tenant that is not public (pending approval or declined)
 * alike. A backend that fails is a different answer.
 */
describe("whether a failed load means the offer is not available", () => {
  it("does for a 404 of the backend", () => {
    expect(isNotAvailableError({ statusCode: 404 })).toBe(true);
    expect(isNotAvailableError({ status: 404 })).toBe(true);
  });

  it("does not for an infrastructure error", () => {
    expect(isNotAvailableError({ statusCode: 500 })).toBe(false);
    expect(isNotAvailableError({ statusCode: 502 })).toBe(false);
    expect(isNotAvailableError(new Error("fetch failed"))).toBe(false);
  });

  it("does not for a refused login or permission", () => {
    expect(isNotAvailableError({ statusCode: 401 })).toBe(false);
    expect(isNotAvailableError({ statusCode: 403 })).toBe(false);
  });

  it("does not without an error", () => {
    expect(isNotAvailableError(null)).toBe(false);
    expect(isNotAvailableError(undefined)).toBe(false);
  });
});

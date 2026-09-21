import { describe, expect, it } from "vitest";

import {
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

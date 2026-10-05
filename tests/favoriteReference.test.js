import { describe, expect, it } from "vitest";

import {
  FAVORITE_LIMIT_REACHED,
  favoriteErrorCodeOf,
  favoriteErrorParamsOf,
  favoriteKey,
  referenceOf,
  targetTypeOf,
} from "~/composables/favorites/favoriteReference.js";

describe("the favorite reference of an Offer", () => {
  it("takes a bookable of any Kind as a bookable, a ticket included", () => {
    expect(targetTypeOf({ type: "room" })).toBe("bookable");
    expect(targetTypeOf({ type: "ticket" })).toBe("bookable");
    expect(targetTypeOf({ type: "resource" })).toBe("bookable");
  });

  it("takes an event as an event, by its Kind or by the caller's word", () => {
    expect(targetTypeOf({ type: "event" })).toBe("event");
    expect(targetTypeOf({ type: undefined }, true)).toBe("event");
  });

  it("pairs the tenant with the id, as bookings do", () => {
    const reference = referenceOf({ id: "b-1", tenantId: "default", type: "room" });

    expect(reference).toEqual({
      tenantId: "default",
      targetType: "bookable",
      targetId: "b-1",
    });
    expect(favoriteKey(reference)).toBe("bookable:default:b-1");
  });

  it("keeps the same id of two tenants apart", () => {
    expect(favoriteKey({ tenantId: "a", targetType: "bookable", targetId: "x" }))
      .not.toBe(favoriteKey({ tenantId: "b", targetType: "bookable", targetId: "x" }));
  });
});

describe("the error behind a refused write", () => {
  const backendBody = {
    error: "ConflictError",
    code: FAVORITE_LIMIT_REACHED,
    statusCode: 409,
    params: { limit: 200 },
  };

  it("reads the code and the params the BFF nests under the H3 error", () => {
    const error = { statusCode: 409, data: { statusCode: 409, data: backendBody } };

    expect(favoriteErrorCodeOf(error)).toBe(FAVORITE_LIMIT_REACHED);
    expect(favoriteErrorParamsOf(error)).toEqual({ limit: 200 });
  });

  it("reads a bare backend body as well", () => {
    const error = { statusCode: 409, data: backendBody };

    expect(favoriteErrorCodeOf(error)).toBe(FAVORITE_LIMIT_REACHED);
    expect(favoriteErrorParamsOf(error).limit).toBe(200);
  });

  it("answers nothing for an error without a code", () => {
    expect(favoriteErrorCodeOf({ statusCode: 500 })).toBeNull();
    expect(favoriteErrorParamsOf(undefined)).toEqual({});
  });
});

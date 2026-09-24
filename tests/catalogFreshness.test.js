import { describe, expect, it } from "vitest";

import {
  mayReuseLoadedDetail,
  withoutWithdrawnDetail,
} from "~/utils/catalogFreshness.js";

/**
 * Tenant supervision: a page that is already open needs no live refresh, but
 * every new entry to a detail page asks the backend again, so a tenant that is
 * no longer public (pending approval or declined) or a withdrawn approval is
 * not shown from what the client still holds.
 */
describe("mayReuseLoadedDetail", () => {
  it("fetches a detail that has not been loaded", () => {
    expect(mayReuseLoadedDetail({ loaded: false, hydrating: true })).toBe(false);
  });

  it("reuses the detail the server just rendered while the page hydrates", () => {
    expect(mayReuseLoadedDetail({ loaded: true, hydrating: true })).toBe(true);
  });

  it("reuses a detail loaded earlier in the same server request", () => {
    expect(mayReuseLoadedDetail({ loaded: true, server: true })).toBe(true);
  });

  it("fetches again on a new client-side entry, although the detail is in the store", () => {
    expect(mayReuseLoadedDetail({ loaded: true, hydrating: false })).toBe(false);
  });

  it("fetches when the caller forces it", () => {
    expect(
      mayReuseLoadedDetail({ loaded: true, hydrating: true, force: true }),
    ).toBe(false);
  });
});

describe("withoutWithdrawnDetail", () => {
  const items = [{ id: "b-1" }, { id: "b-2" }];

  it("drops the requested item when the fresh answer no longer carries it", () => {
    expect(withoutWithdrawnDetail(items, "b-1", undefined)).toEqual([
      { id: "b-2" },
    ]);
  });

  it("keeps the list when the fresh answer carries the item", () => {
    expect(withoutWithdrawnDetail(items, "b-1", { id: "b-1" })).toBe(items);
  });

  it("keeps the list when no item was requested", () => {
    expect(withoutWithdrawnDetail(items, null, undefined)).toBe(items);
  });
});

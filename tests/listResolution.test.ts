import { describe, expect, it } from "vitest";

import { ListResolutionError, mergeTenantLists } from "~~/server/api/utils/listResolution";

/**
 * A catalog list is asked per tenant. An empty list and a backend that failed
 * are different answers: the first is a success, the second an error.
 */
describe("the list of a catalog across its tenants", () => {
  const ok = (data: unknown) => ({ data, error: null });
  const failed = (status: number) => ({
    data: null,
    error: { status, message: "failed" },
  });

  it("joins what every tenant delivers", () => {
    expect(mergeTenantLists([ok([{ id: "a1" }]), ok([{ id: "b1" }])])).toEqual([
      { id: "a1" },
      { id: "b1" },
    ]);
  });

  it("is empty when the tenants deliver nothing", () => {
    expect(mergeTenantLists([ok([]), ok([])])).toEqual([]);
    expect(mergeTenantLists([])).toEqual([]);
  });

  it("leaves out a tenant the backend no longer delivers (404)", () => {
    expect(mergeTenantLists([ok([{ id: "a1" }]), failed(404)])).toEqual([
      { id: "a1" },
    ]);
    expect(mergeTenantLists([failed(404)])).toEqual([]);
  });

  it("stays usable when one of several tenants fails", () => {
    expect(mergeTenantLists([ok([{ id: "a1" }]), failed(500)])).toEqual([
      { id: "a1" },
    ]);
  });

  it("is an error, not an empty list, when the backend answers for no tenant", () => {
    expect(() => mergeTenantLists([failed(502)])).toThrow(ListResolutionError);
    expect(() => mergeTenantLists([failed(503), failed(404)])).toThrow(
      ListResolutionError,
    );
  });
});

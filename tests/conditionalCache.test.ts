import { describe, expect, it } from "vitest";

import { resolveCachePolicy } from "~~/server/utils/conditionalCache";

/**
 * Tenant supervision: an answer that carries a tenant or offer release must
 * show the new state on the very next request after its tenant goes non-public
 * (pending approval or declined) or an approval is withdrawn, so it is never
 * kept in the server-side response cache — whatever the operator set
 * `NUXT_CACHE_ENABLED` to.
 */
describe("resolveCachePolicy", () => {
  it("never caches a release-sensitive answer, even with the cache switched on", () => {
    expect(
      resolveCachePolicy({ releaseSensitive: true }, { NUXT_CACHE_ENABLED: "true" }),
    ).toEqual({ cached: false });
    expect(resolveCachePolicy({ releaseSensitive: true }, {})).toEqual({
      cached: false,
    });
  });

  it("ignores a cache lifetime asked for on a release-sensitive answer", () => {
    expect(
      resolveCachePolicy({ releaseSensitive: true, maxAge: 300, swr: true }, {}),
    ).toEqual({ cached: false });
  });

  it("caches a release-free answer for 300 s with SWR by default", () => {
    expect(resolveCachePolicy({}, {})).toEqual({
      cached: true,
      maxAge: 300,
      swr: true,
    });
  });

  it("keeps the lifetime a release-free answer asks for", () => {
    expect(resolveCachePolicy({ maxAge: 60, swr: false }, {})).toEqual({
      cached: true,
      maxAge: 60,
      swr: false,
    });
  });

  it("caches nothing when the operator sets NUXT_CACHE_ENABLED=false", () => {
    expect(resolveCachePolicy({}, { NUXT_CACHE_ENABLED: "false" })).toEqual({
      cached: false,
    });
  });
});

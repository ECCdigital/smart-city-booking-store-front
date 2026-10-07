import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseReturnTarget } from "~~/shared/utils/returnTarget";

// The middleware relies on Nuxt's auto-imported helpers.
vi.stubGlobal("defineNuxtRouteMiddleware", (middleware) => middleware);
const navigateTo = vi.fn((target) => target);
vi.stubGlobal("navigateTo", navigateTo);

let catalog = null;
let fetchError = null;
let authValid = false;
vi.mock("~/composables/api/useCatalog.js", () => ({
  useCatalog: () => ({
    fetchCatalog: async () => {
      if (fetchError) throw fetchError;
      return catalog;
    },
  }),
}));
vi.mock("~/composables/auth/useAuth.js", () => ({
  useAuth: () => ({ validateAuth: async () => authValid }),
}));

const { default: catalogAuth } = await import("~/middleware/catalog-auth.js");

/** The return target the login page reads from the middleware's answer. */
function returnTargetOf(loginPath) {
  const url = new URL(loginPath, "http://storefront.invalid");
  expect(url.pathname).toBe("/login");
  return parseReturnTarget(url.searchParams.get("redirect"));
}

const route = (fullPath) => ({
  params: { catalogSlug: "sport" },
  fullPath,
});

describe("catalog-auth", () => {
  beforeEach(() => {
    navigateTo.mockClear();
    catalog = { visibility: "private" };
    fetchError = null;
    authValid = false;
  });

  it("sends a guest of a private catalog to the login and back to the page, query included", async () => {
    const fullPath = "/catalog/sport?category=room&page=2#results";

    const loginPath = await catalogAuth(route(fullPath));

    expect(returnTargetOf(loginPath)).toBe(fullPath);
  });

  it("keeps the query when the catalog answers 401", async () => {
    fetchError = { statusCode: 401 };
    const fullPath = "/catalog/sport/search?q=a%26b&tags=x&tags=y";

    const loginPath = await catalogAuth(route(fullPath));

    expect(returnTargetOf(loginPath)).toBe(fullPath);
  });

  it("carries no target that leaves the storefront", async () => {
    const loginPath = await catalogAuth(route("//evil.example/catalog/sport"));

    expect(loginPath).toBe("/login");
  });

  it("lets a signed-in user through", async () => {
    authValid = true;

    await catalogAuth(route("/catalog/sport?category=room"));

    expect(navigateTo).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, defineStore, setActivePinia } from "pinia";

/**
 * Drives the real favorites store against a fake BFF. The Nuxt auto-imports
 * the store relies on (`defineStore`, `useApiClient`) are stubbed on
 * `globalThis`, the same way the store sees them at runtime.
 */

const reference = (targetId, tenantId = "default", targetType = "bookable") => ({
  tenantId,
  targetType,
  targetId,
});

let backendList = [];
let putAnswer = null;
const calls = [];

globalThis.defineStore = defineStore;
globalThis.useApiClient = () => ({
  get: vi.fn(async (url) => {
    calls.push(["GET", url]);
    return { data: backendList, error: null };
  }),
  put: vi.fn(async (url) => {
    calls.push(["PUT", url]);
    if (putAnswer?.error) return { data: null, error: putAnswer.error };
    return { data: putAnswer?.data ?? null, error: null };
  }),
  delete: vi.fn(async (url) => {
    calls.push(["DELETE", url]);
    return { data: null, error: null };
  }),
});

const { useFavoritesStore } = await import("~~/stores/favorites.js");

describe("the favorites store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    backendList = [];
    putAnswer = null;
    calls.length = 0;
  });

  it("loads the list once, however many cards ask", async () => {
    backendList = [{ ...reference("b-1"), created: "2026-10-01T00:00:00Z" }];
    const store = useFavoritesStore();

    await Promise.all([
      store.fetchFavorites(),
      store.fetchFavorites(),
      store.fetchFavorites(),
    ]);
    await store.fetchFavorites();

    expect(calls.filter(([method]) => method === "GET")).toHaveLength(1);
    expect(store.isFavorite(reference("b-1"))).toBe(true);
    expect(store.isFavorite(reference("b-2"))).toBe(false);
  });

  it("fills the heart at once and keeps the reference the backend answers", async () => {
    putAnswer = {
      data: {
        ...reference("b-2"),
        title: "Großer Saal",
        tenantName: "Stadt",
        created: "2026-10-01T10:00:00Z",
      },
    };
    const store = useFavoritesStore();
    await store.fetchFavorites();

    const marking = store.mark(reference("b-2"));
    expect(store.isFavorite(reference("b-2"))).toBe(true);
    expect(store.isPending(reference("b-2"))).toBe(true);
    await marking;

    expect(store.isPending(reference("b-2"))).toBe(false);
    expect(store.references).toEqual([
      { ...reference("b-2"), created: "2026-10-01T10:00:00Z" },
    ]);
    expect(calls).toContainEqual([
      "PUT",
      "/api/favorites/default/bookable/b-2",
    ]);
    // The list is updated from the answer, not reloaded.
    expect(calls.filter(([method]) => method === "GET")).toHaveLength(1);
  });

  it("takes the mark back when the backend refuses it, and says why", async () => {
    putAnswer = {
      error: {
        statusCode: 409,
        statusMessage: "Conflict",
        data: { data: { code: "favorite.limit_reached", params: { limit: 2 } } },
      },
    };
    const store = useFavoritesStore();
    await store.fetchFavorites();

    await expect(store.mark(reference("b-3"))).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(store.isFavorite(reference("b-3"))).toBe(false);
    expect(store.isPending(reference("b-3"))).toBe(false);
  });

  it("marks an event under its own target type", async () => {
    putAnswer = { data: reference("e-1", "default", "event") };
    const store = useFavoritesStore();

    await store.mark(reference("e-1", "default", "event"));

    expect(calls).toContainEqual(["PUT", "/api/favorites/default/event/e-1"]);
    expect(store.isFavorite(reference("e-1", "default", "event"))).toBe(true);
    expect(store.isFavorite(reference("e-1"))).toBe(false);
  });

  it("empties the heart at once on removal and ignores a second click", async () => {
    backendList = [reference("b-1")];
    const store = useFavoritesStore();
    await store.fetchFavorites();

    const removing = store.unmark(reference("b-1"));
    expect(store.isFavorite(reference("b-1"))).toBe(false);
    await store.unmark(reference("b-1"));
    await removing;

    expect(calls.filter(([method]) => method === "DELETE")).toHaveLength(1);
  });

  it("forgets the list with the session", async () => {
    backendList = [reference("b-1")];
    const store = useFavoritesStore();
    await store.fetchFavorites();

    store.$reset();

    expect(store.initialized).toBe(false);
    expect(store.isFavorite(reference("b-1"))).toBe(false);
  });
});

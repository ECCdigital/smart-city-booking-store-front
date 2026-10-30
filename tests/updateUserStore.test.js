import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, defineStore, setActivePinia } from "pinia";
import { computed, readonly } from "vue";

/**
 * Saving the own profile in the auth store (ECCdigital/tickets#299): the
 * settings learn whether the save went through, and a failed save leaves
 * the signed-in user as it was.
 *
 * Drives the real store; the Nuxt auto-imports it relies on are stubbed on
 * `globalThis`, `useApiClient().put` is the storefront's server route.
 */

let answer;
const put = vi.fn(async (url, body) => answer(url, body));

globalThis.defineStore = defineStore;
globalThis.computed = computed;
globalThis.readonly = readonly;
globalThis.useApiClient = () => ({ put });

const { useAuthStore } = await import("~~/stores/auth.js");

const savedUser = { id: "u-1", firstName: "Erika", lastName: "Muster" };

function signedIn() {
  const store = useAuthStore();
  store.setAuthPayload({ user: { ...savedUser }, tokenValid: true });
  return store;
}

function failingSave() {
  answer = () => ({
    data: null,
    error: { statusCode: 500, statusMessage: "Failed to update user" },
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
}

beforeEach(() => {
  setActivePinia(createPinia());
  put.mockClear();
  answer = (_url, body) => ({ data: body, error: null });
});

describe("auth store: updateUser", () => {
  it("saves the user without renaming past bookings and keeps it", async () => {
    const store = signedIn();
    const changed = { ...savedUser, firstName: "Erik" };

    const result = await store.updateUser(changed);

    expect(put).toHaveBeenCalledWith("/api/user", {
      ...changed,
      syncSelfBookingNames: false,
    });
    expect(result).toEqual({ success: true });
    expect(store.user).toEqual(changed);
  });

  it("answers a failed save", async () => {
    failingSave();
    const store = signedIn();

    const result = await store.updateUser({ ...savedUser, firstName: "Erik" });

    expect(result).toEqual({ success: false });
  });

  it("keeps the signed-in user as it was when the save fails", async () => {
    failingSave();
    const store = signedIn();

    await store.updateUser({ ...savedUser, firstName: "Erik" });

    expect(store.user).toEqual(savedUser);
    expect(store.isLoggedIn).toBe(true);
  });
});

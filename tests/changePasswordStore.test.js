import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, defineStore, setActivePinia } from "pinia";
import { computed, readonly } from "vue";

/**
 * The own password change in the auth store (ECCdigital/tickets#264): the
 * settings send the current password with the new one, and learn whether
 * the change went through and, if not, the status the backend gave - a
 * wrong current password is 403.
 *
 * Drives the real store; the Nuxt auto-imports it relies on are stubbed on
 * `globalThis`, `$fetch` is the storefront's server route.
 */

let answer;

globalThis.defineStore = defineStore;
globalThis.computed = computed;
globalThis.readonly = readonly;
globalThis.$fetch = vi.fn(async (url) => answer(url));

const { useAuthStore } = await import("~~/stores/auth.js");

beforeEach(() => {
  setActivePinia(createPinia());
  globalThis.$fetch.mockClear();
  answer = () => ({ success: true });
});

describe("auth store: changePassword", () => {
  it("sends the current and the new password, and names no account", async () => {
    const result = await useAuthStore().changePassword("bisher-1", "neu-2");

    expect(globalThis.$fetch).toHaveBeenCalledWith("/api/auth/change-password", {
      method: "POST",
      body: { currentPassword: "bisher-1", password: "neu-2" },
    });
    expect(result).toEqual({ success: true });
  });

  it("answers the status of a refusal", async () => {
    answer = () => {
      throw Object.assign(new Error("refused"), { statusCode: 403 });
    };
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await useAuthStore().changePassword("geraten", "neu-2");

    expect(result).toEqual({ success: false, statusCode: 403 });
  });

  const signedIn = () => {
    const store = useAuthStore();
    store.setAuthPayload({ user: { id: "u-1" }, tokenValid: true });
    return store;
  };
  const refusedWith = (statusCode) =>
    Object.assign(new Error("refused"), { statusCode });

  it("signs out when the renewal failed during the change: the session's cookies are gone (tickets#108)", async () => {
    answer = () => {
      throw refusedWith(401);
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = signedIn();

    const result = await store.changePassword("bisher-1", "neu-2");

    expect(result).toEqual({ success: false, statusCode: 401 });
    expect(globalThis.$fetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.anything(),
    );
    expect(store.isLoggedIn).toBe(false);
  });

  it("stays signed in on a wrong current password", async () => {
    answer = () => {
      throw refusedWith(403);
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = signedIn();

    await store.changePassword("geraten", "neu-2");

    expect(globalThis.$fetch).not.toHaveBeenCalledWith(
      "/api/auth/me",
      expect.anything(),
    );
    expect(store.isLoggedIn).toBe(true);
  });
});

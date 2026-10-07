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
globalThis.$fetch = vi.fn(async () => answer());

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
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, defineStore, setActivePinia } from "pinia";

/**
 * Regression for tickets#18: after logging out user A and logging in as
 * user B, the account pages showed A's bookings until a hard refresh.
 *
 * Drives the real auth and bookings stores. The Nuxt auto-imports the
 * stores rely on (`defineStore`, `$fetch`, `useApiClient`, `useCookie`)
 * are stubbed on `globalThis`, the same way the stores see them at runtime.
 */

const bookingsByUser = {
  a: [{ id: "a-1", bookableId: "room", assignedUserId: "a" }],
  b: [{ id: "b-1", bookableId: "room", assignedUserId: "b" }],
};

// The user the fake backend currently considers logged in (via cookie).
let cookieUser = null;

globalThis.defineStore = defineStore;
globalThis.useCookie = () => ({ value: "local" });
globalThis.createError = (e) => Object.assign(new Error(e.statusMessage), e);
globalThis.useRequestHeaders = () => ({});
globalThis.useRoute = () => ({ path: "/" });
globalThis.navigateTo = vi.fn();
globalThis.$fetch = vi.fn(async (url, opts = {}) => {
  if (url === "/api/auth/login") {
    cookieUser = opts.body.id;
    return { success: true, data: { user: { id: cookieUser }, permissions: {} } };
  }
  if (url === "/api/auth/logout") {
    cookieUser = null;
    return { success: true };
  }
  throw new Error(`unexpected $fetch ${url}`);
});
globalThis.useApiClient = () => ({
  get: vi.fn(async (url) => {
    if (url === "/api/bookings/") {
      if (!cookieUser) {
        return { data: null, error: { statusCode: 401, statusMessage: "nope" } };
      }
      return { data: bookingsByUser[cookieUser], error: null };
    }
    throw new Error(`unexpected api.get ${url}`);
  }),
});

const { useAuthStore } = await import("~~/stores/auth.js");
const { useBookingStore } = await import("~~/stores/bookings.js");

describe("bookings store across a user switch", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    cookieUser = null;
  });

  it("shows user B their own bookings after A logged out", async () => {
    const auth = useAuthStore();
    const bookings = useBookingStore();

    await auth.login({ id: "a" });
    expect(await bookings.fetchBookings()).toEqual(bookingsByUser.a);

    await auth.logout();
    await auth.login({ id: "b" });

    // The account pages call this without `force`, exactly like the app does.
    const seen = await bookings.fetchBookings();
    expect(seen.map((b) => b.id)).toEqual(["b-1"]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// The backend's /json/:tenantId/... endpoints return bare objects and arrays,
// regardless of whether the catalog is a single-tenant or an instance catalog.
const responses = new Map<string, unknown>();
vi.mock("~~/server/api/utils/serverFetch", () => ({
  serverFetch: vi.fn(async (_event: unknown, path: string) =>
    responses.has(path)
      ? { data: responses.get(path), error: null }
      : { data: null, error: { status: 404, message: "Not found" } },
  ),
}));
vi.stubGlobal("createError", (input: object) =>
  Object.assign(new Error("createError"), input),
);

const { loadBundleData } = await import("~~/server/api/utils/loadBundleData");

const tenantId = "tenant-1";
const bookable = { id: "bookable-1", tenantId, title: "Lab" };
const event = { id: "event-1", tenantId, name: "Workshop" };
const single = { catalog: { type: "single", tenantId }, tenants: [{ id: tenantId }] };
const h3Event = {} as never;

describe("loadBundleData for a single-tenant catalog", () => {
  beforeEach(() => {
    responses.clear();
    responses.set(`/json/${tenantId}/bookables/${bookable.id}`, bookable);
    responses.set(`/json/${tenantId}/events/${event.id}`, event);
    responses.set(`/json/${tenantId}/bookables/`, [bookable]);
    responses.set(`/json/${tenantId}/events/`, [event]);
  });

  it("loads a bookable of the tenant", async () => {
    const result = await loadBundleData(h3Event, { ...single, bookableId: bookable.id });
    expect(result.bookable).toEqual(bookable);
  });

  it("loads an event of the tenant", async () => {
    const result = await loadBundleData(h3Event, { ...single, eventId: event.id });
    expect(result.event).toEqual(event);
  });

  it("loads the tenant's bookables and events", async () => {
    const result = await loadBundleData(h3Event, { ...single, include: "bookables,events" });
    expect(result.bookables).toEqual([bookable]);
    expect(result.events).toEqual([event]);
  });

  it("rejects an unknown bookable with 404", async () => {
    await expect(
      loadBundleData(h3Event, { ...single, bookableId: "missing" }),
    ).rejects.toMatchObject({ statusCode: 404, statusMessage: "Bookable not found" });
  });
});

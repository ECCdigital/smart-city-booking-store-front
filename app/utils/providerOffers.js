/**
 * „Angebot nach Anbietern“ on the instance home (ECCdigital/tickets#478):
 * the tenants of the catalog bundle as tiles. A tenant without a bookable
 * and without an event is left out; the most offers come first, a tie goes
 * by name. The counts are the backend's (listed offers, no tickets, no
 * ended events); a bundle without them shows no tile.
 *
 * @param {Array<{ id: string, name: string, description?: string, bookableCount?: number, eventCount?: number }> | undefined} tenants
 * @returns {Array<{ id: string, name: string, description: string | null, bookableCount: number, eventCount: number }>}
 */
export function providerTiles(tenants) {
  return (tenants ?? [])
    .map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description?.trim() || null,
      bookableCount: tenant.bookableCount ?? 0,
      eventCount: tenant.eventCount ?? 0,
    }))
    .filter((tile) => tile.bookableCount + tile.eventCount > 0)
    .sort(
      (a, b) =>
        b.bookableCount + b.eventCount - (a.bookableCount + a.eventCount) ||
        a.name.localeCompare(b.name, "de"),
    );
}

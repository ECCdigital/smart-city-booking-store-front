/**
 * „Angebot nach Anbietern“ on the instance home (ECCdigital/tickets#478):
 * the tenants of the catalog bundle as tiles. A tenant without a bookable
 * and without an event is left out; the most offers come first, a tie goes
 * by name. The counts are the backend's (listed offers, no tickets, no
 * ended events); a bundle without them shows no tile.
 *
 * @param {Array<{ id: string, name: string, description?: string, bookableCount?: number, eventCount?: number }> | undefined} tenants
 * @returns {Array<{ id: string, name: string, description: string | null, bookableCount: number, eventCount: number, initials: string }>}
 */
export function tenantTiles(tenants) {
  return (tenants ?? [])
    .map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      description: tenant.description?.trim() || null,
      bookableCount: tenant.bookableCount ?? 0,
      eventCount: tenant.eventCount ?? 0,
      initials: tenantInitials(tenant.name),
    }))
    .filter((tile) => tile.bookableCount + tile.eventCount > 0)
    .sort(
      (a, b) =>
        b.bookableCount + b.eventCount - (a.bookableCount + a.eventCount) ||
        a.name.localeCompare(b.name, "de"),
    );
}

/**
 * The letters on a provider's tile: the first letter of each of the first
 * two words, or the first two letters of a single word. Words that do not
 * start with a letter (`&`, `-`) are skipped.
 *
 * @param {string | undefined} name
 * @returns {string}
 */
export function tenantInitials(name) {
  const words = (name ?? "")
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word));
  if (words.length === 0) return "?";
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
}

/**
 * The accent colour of a provider's tile, as an index into a palette of
 * `size` colours: derived from the id, so a tenant keeps its colour.
 *
 * @param {string} id
 * @param {number} size
 * @returns {number}
 */
export function tenantAccent(id, size) {
  let hash = 0;
  for (const char of String(id)) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }
  return hash % size;
}

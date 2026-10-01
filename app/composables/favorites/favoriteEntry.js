/**
 * The framework-free part of the favorites page: how one hydrated entry of
 * the favorites list (`GET /api/favorites/offers`) is read. An entry carries
 * the reference, the snapshot (`title`, `tenantName`) taken when the Offer
 * was marked, one of three states, and, when available, the Offer in its
 * public projection.
 */

import { favoriteKey } from "./favoriteReference.js";

export const FAVORITE_STATUS = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  DELETED: "deleted",
});

/** The value of the tenant filter that narrows to nothing. */
export const ALL_TENANTS = "*";

export function isAvailable(entry) {
  return entry?.status === FAVORITE_STATUS.AVAILABLE && !!entry.offer;
}

/**
 * The Offer of an available entry as the catalog reads it. The backend
 * answers an event bare, without the Kind the storefront's bundle loader
 * stamps on it, and the result cards branch on that Kind; the tenant comes
 * from the entry when the projection leaves it out.
 */
export function offerOf(entry) {
  if (!isAvailable(entry)) return null;
  const offer = {
    ...entry.offer,
    tenantId: entry.offer.tenantId ?? entry.tenantId,
  };
  if (entry.targetType === "event") offer.type = "event";
  return offer;
}

/** The title of an entry: the current one while available, the snapshot otherwise. */
export function titleOf(entry) {
  const offer = offerOf(entry);
  const current =
    entry?.targetType === "event" ? offer?.information?.name : offer?.title;
  return current || entry?.title || "";
}

/** The path of the detail view inside the Offer's tenant. */
export function detailPathOf(entry) {
  const id = encodeURIComponent(entry.targetId);
  return entry.targetType === "event" ? `/events/${id}` : `/bookables/${id}`;
}

/** The tenants the entries belong to, each once, in the order they first appear. */
export function tenantsOf(entries) {
  const seen = new Map();
  for (const entry of entries ?? []) {
    if (!entry?.tenantId || seen.has(entry.tenantId)) continue;
    seen.set(entry.tenantId, {
      id: entry.tenantId,
      name: entry.tenantName || entry.tenantId,
    });
  }
  return [...seen.values()];
}

export function filterByTenant(entries, tenantId) {
  if (!tenantId || tenantId === ALL_TENANTS) return entries ?? [];
  return (entries ?? []).filter((entry) => entry.tenantId === tenantId);
}

/**
 * The entries still marked: the loaded list narrowed to the references the
 * store holds, so a removal (from the heart or the remove button) takes the
 * entry out at once and a refused removal brings it back. Before the
 * references are known, the loaded list stands as it is.
 */
export function stillMarked(entries, keys, referencesKnown = true) {
  if (!referencesKnown) return entries ?? [];
  return (entries ?? []).filter((entry) => keys.has(favoriteKey(entry)));
}

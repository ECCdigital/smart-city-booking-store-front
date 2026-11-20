import haversine from "haversine-distance";

/**
 * „In Ihrer Nähe“ on the start page: the Offers with a location and, where
 * the device tells its position, only those within a radius of it.
 */

/** The radius around the device's position, in km. */
export const NEARBY_RADIUS_KM = 20;

/**
 * The Offer's position as `[lng, lat]` (GeoJSON order, as the backend stores
 * it), or `null` where it has none.
 *
 * @param {{ location?: { coordinates?: { points?: number[] } } }} item
 * @returns {[number, number]|null}
 */
export function offerPoint(item) {
  const [lng, lat] = item?.location?.coordinates?.points ?? [];
  return Number.isFinite(lng) && Number.isFinite(lat) && (lng || lat)
    ? [lng, lat]
    : null;
}

/**
 * The wrapped Offers (`{ item }`) that have a location; with a position, only
 * those at most `radiusKm` away from it.
 *
 * @param {Array<{ item: Object }>} offers
 * @param {{ lat: number, lng: number }|null} [position]
 * @param {number} [radiusKm]
 * @returns {Array<{ item: Object }>}
 */
export function placedOffers(offers, position = null, radiusKm = NEARBY_RADIUS_KM) {
  return (offers ?? []).filter(({ item }) => {
    const point = offerPoint(item);
    if (!point) return false;
    if (!position) return true;
    return haversine([position.lng, position.lat], point) <= radiusKm * 1000;
  });
}

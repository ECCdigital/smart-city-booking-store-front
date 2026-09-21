/**
 * The decisions of a bookable or event detail page reached by a direct
 * link. The page loads its offer by id, independent of the catalog list;
 * what the backend does not deliver is "not available".
 */

/**
 * Whether the detail has to be asked for. Only an earlier detail load of
 * the same offer spares the request — an offer a list bundle put into the
 * store does not, and an offer the list lacks is asked for like any other.
 */
export function shouldLoadDetail({
  detailId,
  loadedDetailIds = [],
  force = false,
}) {
  if (force) return true;
  return !(loadedDetailIds ?? []).includes(detailId);
}

/**
 * The tenant a link names explicitly (`?tenantId=`), as the checkout links
 * do. It only tells the BFF where else to ask; it grants nothing.
 */
export function tenantHintOf(query) {
  const value = query?.tenantId;
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.length > 0 ? first : null;
}

/**
 * The tenant whose public information is still missing for a resolved
 * offer: the offer's tenant when the catalog does not list it, else null.
 */
export function missingTenantIdOf(item, knownTenants = []) {
  const tenantId = item?.tenantId;
  if (!tenantId) return null;
  return knownTenants.some((tenant) => tenant.id === tenantId)
    ? null
    : tenantId;
}

/**
 * Whether a failed load means "this offer is not (or no longer) available":
 * the backend answered 404. Never existed, withdrawn and blocked are one
 * answer; every other failure stays an error.
 */
export function isNotAvailableError(error) {
  return (error?.statusCode ?? error?.status) === 404;
}

/**
 * Tenant supervision: a tenant can be blocked and an offer's approval can be
 * withdrawn at any time. A page that is already open needs no live refresh,
 * but every new entry to a detail page has to ask the backend again.
 */

/**
 * Whether a detail the client already holds may answer a load without a
 * request. Only the hand-over from SSR to the hydrating client qualifies — and
 * the server itself, whose stores live for one request.
 *
 * @param {object} params
 * @param {boolean} params.loaded - The detail is in the store for this context.
 * @param {boolean} [params.hydrating] - The client is hydrating the SSR page.
 * @param {boolean} [params.server] - The load runs during SSR.
 * @param {boolean} [params.force] - The caller asked for a fresh load.
 * @returns {boolean}
 */
export function mayReuseLoadedDetail({
  loaded,
  hydrating = false,
  server = false,
  force = false,
}) {
  if (force || !loaded) return false;
  return Boolean(server || hydrating);
}

/**
 * The store list without an item the backend no longer delivers, so a copy
 * from an earlier list or detail load is not shown in its place.
 *
 * @param {Array<{id: string}>} items - The list the store holds.
 * @param {string|null|undefined} requestedId - The detail that was asked for.
 * @param {object|null|undefined} fresh - The detail of the fresh answer.
 * @returns {Array<{id: string}>} The same list when nothing has to go.
 */
export function withoutWithdrawnDetail(items, requestedId, fresh) {
  if (!requestedId || fresh) return items;
  return items.filter((item) => item.id !== requestedId);
}

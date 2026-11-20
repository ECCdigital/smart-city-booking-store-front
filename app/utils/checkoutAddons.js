/**
 * The add-ons a checkout offers next to its lead bookable, loaded from the
 * lead's `checkoutBookableIds`.
 */

import { isNotAvailableError } from "./catalogDetail.js";

const MISSING = Symbol("missing");

/**
 * Loads every add-on with `fetchAddon(bookableId)` and returns
 * `[{ item, mandatory }]` in the order of `entries`. An optional add-on the
 * backend no longer has (404) is left out, so a deleted add-on does not
 * block the lead. A missing mandatory add-on and every other failure is
 * thrown on.
 */
export async function loadCheckoutAddons(entries, fetchAddon) {
  const loaded = await Promise.all(
    (entries ?? []).map(async ({ bookableId, mandatory }) => {
      try {
        return { item: await fetchAddon(bookableId), mandatory };
      } catch (error) {
        if (!mandatory && isNotAvailableError(error)) return MISSING;
        throw error;
      }
    }),
  );
  return loaded.filter((addon) => addon !== MISSING);
}

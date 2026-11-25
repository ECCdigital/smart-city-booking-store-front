/**
 * Whether bookers pay every started hour in full: an hour price with
 * `priceCountStartedHours`, as the backend prices it, and at least one
 * internal price that is billed by the hour (a Pauschalpreis is not).
 */
export function countsStartedHours(bookable) {
  return (
    bookable?.priceType === "per-hour" &&
    !!bookable.priceCountStartedHours &&
    (bookable.priceCategories || []).some(
      (category) => !category.external && !category.fixedPrice,
    )
  );
}

import { computed, ref } from "vue";

/**
 * A booking discount as reported by the checkout validation: a whole percent
 * between 0 and 100, anything else counts as no discount.
 */
export function toDiscountPercent(value: unknown): number {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

/**
 * The user's choice to book at the regular price despite a role discount.
 *
 * `eligibility` holds the discount percent per bookable from the last
 * validation; it decides whether the checkout offers the choice at all. The
 * waiver itself is only the user's wish: the checkout validates again when it
 * changes and sends it along, so it must not follow `eligibility`, or every
 * validation result would start the next one (ECCdigital/tickets#494). Sending
 * the wish for a bookable without a discount leaves its price as it is.
 */
export function useBookingDiscountWaiver() {
  const eligibility = ref<Record<string, unknown>>({});
  const preference = ref<boolean | null>(null);

  const hasOption = computed(() =>
    Object.values(eligibility.value).some(
      (value) => toDiscountPercent(value) > 0,
    ),
  );

  const maxPercent = computed(() => {
    const values = Object.values(eligibility.value).map(toDiscountPercent);
    return values.length > 0 ? Math.max(...values) : 0;
  });

  const isWithoutDiscount = computed(() => preference.value === true);

  const selected = computed({
    get: () => isWithoutDiscount.value,
    set: (value: boolean) => {
      preference.value = value === true;
    },
  });

  function reset() {
    eligibility.value = {};
    preference.value = null;
  }

  return {
    eligibility,
    preference,
    hasOption,
    maxPercent,
    isWithoutDiscount,
    selected,
    reset,
  };
}

<template>
  <div
    class="text-gray-800 dark:text-gray-100 w-auto"
    :class="isMapStripe ? '' : 'text-right w-auto'"
  >
    <!-- discounted price for user (role discount, coupon, etc.) -->
    <p
      v-if="
        props.calculatedPrice &&
        calculatedPrice.regularGrossPriceEur > calculatedPrice.userGrossPriceEur
      "
    >
      <span class="text-gray-500 line-through mr-2">
        {{ displayPrice(calculatedPrice.regularGrossPriceEur) }}
      </span>
      <span>
        {{ displayPrice(calculatedPrice.userGrossPriceEur) }}
      </span>
      <br />
      <span
        v-if="discountPercentLabel"
        class="text-xs font-normal text-emerald-700 dark:text-emerald-300"
      >
        {{ discountPercentLabel }}
      </span>
      <span v-else class="text-xs font-normal text-gray-600 dark:text-gray-300">
        {{ displayPricePerUnit() }}
      </span>
    </p>

    <!-- free for users (legacy fallback when prices are equal) -->
    <p
      v-else-if="props.calculatedPrice && !!calculatedPrice.freeBookingAllowed"
    >
      <span class="text-gray-500 line-through mr-2">
        {{ displayPrice(calculatedPrice.regularGrossPriceEur) }}
      </span>
      <span>{{ $t("checkout.review.totalFree") }}</span>
    </p>

    <!-- regular calculated price -->
    <p v-else-if="calculatedPrice">
      {{ displayPrice(calculatedPrice.regularGrossPriceEur) }}
    </p>

    <!-- price without calculation -->
    <p v-else :class="isMapStripe ? '' : 'grid'">
      {{ displayMinDefaultPrice() }}
      <span class="text-xs mt-0 font-normal text-gray-600 dark:text-gray-300">
        {{ displayPricePerUnit() }}
      </span>
    </p>
  </div>
</template>
<script setup>
const { t } = useI18n();

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  calculatedPrice: {
    type: Object,
    default: null,
  },
  isMapStripe: {
    type: Boolean,
    default: false,
  },
});

function toDiscountPercent(value) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 0;
  return Math.min(100, Math.max(0, Math.round(percent)));
}

const discountPercentLabel = computed(() => {
  const percent = toDiscountPercent(
    props.calculatedPrice?.bookingDiscountPercent,
  );
  if (percent <= 0 || percent >= 100) return null;
  return t("checkout.review.roleDiscountBadge", { percent });
});

function getMinPrice() {
  //all prices are free
  if (
    !props.bookable ||
    !props.bookable.priceCategories ||
    !props.bookable.priceCategories.length ||
    props.bookable.priceCategories.every(
      (c) => c.priceEur === 0 || c.priceEur === null,
    )
  ) {
    return null;
  }

  //exclude external service fees
  const pricesWithoutServiceFees = props.bookable.priceCategories.filter(
    (c) => !c.external || (c.external && c.unit !== "service-fee"),
  );

  //exclude holiday price categories
  const pricesWithoutHolidays = pricesWithoutServiceFees.filter(
    (c) => !c.holidays || c.holidays.length === 0,
  );

  return Math.min(...pricesWithoutHolidays.map((c) => c.priceEur));
}
function displayMinDefaultPrice() {
  const categories = props.bookable.priceCategories || [];
  if (categories.length === 0) {
    return null;
  }
  const prefix = categories.length > 1 ? "ab " : "";

  const min = getMinPrice();
  if (min === null) {
    return "Kostenlos";
  }

  const includeTax = props.bookable.priceValueAddedTax
    ? min + (min * props.bookable.priceValueAddedTax) / 100
    : min;
  return prefix + includeTax.toFixed(2).toString().replace(/\./g, ",") + " €";
}

function displayPrice(currentPrice) {
  if (currentPrice === null) {
    return "Kein Preis bekannt.";
  } else if (currentPrice === 0) {
    return "Kostenlos";
  } else {
    currentPrice = currentPrice.toFixed(2);
    return "€ " + currentPrice.toString().replace(/\./g, ",");
  }
}

function displayPricePerUnit() {
  const minPrice = getMinPrice();
  if (minPrice === null || minPrice === 0) {
    return "";
  }

  let priceType = props.bookable.priceType;
  if (
    props.bookable.priceCategories &&
    props.bookable.priceCategories.some((c) => c.external)
  ) {
    priceType = props.bookable.priceCategories.find(
      (c) => c.external && c.priceEur === minPrice,
    ).unit;
  }

  let includeTaxes = "";
  if (props.bookable.priceValueAddedTax > 0) {
    includeTaxes = "(inkl. MwSt.)";
  }

  switch (priceType) {
    case "per-hour":
      return " pro Stunde " + includeTaxes;
    case "per-item":
      return " pro Stück " + includeTaxes;
    case "per-day":
      return " pro Tag " + includeTaxes;
    case "hour":
      return " pro Stunde " + includeTaxes;
    case "day":
      return " pro Tag " + includeTaxes;
    case "week":
      return " pro Woche " + includeTaxes;
    case "month":
      return " pro Monat " + includeTaxes;
    case "year":
      return " pro Jahr " + includeTaxes;
  }
}
</script>

<style scoped></style>

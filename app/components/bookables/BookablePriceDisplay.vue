<template>
  <div class="text-right">
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
    </p>
    <p v-else-if="props.calculatedPrice">
      {{ displayPrice(calculatedPrice?.regularGrossPriceEur) }}
    </p>
    <p v-else>
      {{ displayMinDefaultPrice() }}
    </p>
    <!--
    <p class="text-xs font-normal text-gray-600 dark:text-gray-300">
      {{ displayPricePerUnit() }}
    </p>
    -->
  </div>
</template>
<script setup>
const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  calculatedPrice: {
    type: Object,
    default: null,
  },
});

function getMinPrice() {
  return Math.min(...props.bookable.priceCategories.map((cat) => cat.priceEur));
}
function displayMinDefaultPrice() {
  if (
    props.bookable.priceCategories &&
    props.bookable.priceCategories.length === 0
  ) {
    return null;
  }

  const min = getMinPrice();
  if (min === 0) {
    return "Kostenlos";
  }
  const includeTax = props.bookable.priceValueAddedTax
    ? min + (min * props.bookable.priceValueAddedTax) / 100
    : min;
  return "ab " + includeTax.toFixed(2).toString().replace(/\./g, ",") + " €";
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

/*
function displayPricePerUnit() {
  const minPrice = getMinPrice();
  if (minPrice === 0) {
    return "";
  }

  let includeTaxes = ""
  if(props.bookable.priceValueAddedTax > 0){
    includeTaxes = "(zzgl. MwSt.)"
  }
  switch (props.bookable.priceType) {
    case "per-hour":
      return minPrice + " € / Stunde " + includeTaxes;
    case "per-item":
      return minPrice + " € / Stück " + includeTaxes;
    case "per-day":
      return minPrice + " € / Tag " + includeTaxes;
  }
}
*/
</script>

<style scoped></style>

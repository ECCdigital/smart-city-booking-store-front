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
  const categories = props.bookable.priceCategories || [];
  if (
      categories.length === 0
  ) {
    return null;
  }
  const prefix = categories.length > 1 ? "ab " : "";

  const min = getMinPrice();
  if (min === 0) {
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
</script>

<style scoped></style>

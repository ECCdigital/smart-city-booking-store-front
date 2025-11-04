<template>
  <div>
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

function displayMinDefaultPrice() {
  if (
    props.bookable.priceCategories &&
    props.bookable.priceCategories.length === 0
  ) {
    return null;
  }

  // Minimum aller priceEur-Werte
  const min = Math.min(
    ...props.bookable.priceCategories.map((cat) => cat.priceEur),
  );

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
  }else if(currentPrice === 0) {
    return "Kostenlos";
  } else {
    currentPrice = currentPrice.toFixed(2);
    return "€ " + currentPrice.toString().replace(/\./g, ",");
  }
}
</script>

<style scoped></style>

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

    <p class="text-xs font-normal text-gray-600 dark:text-gray-300">
      {{ displayPricePerUnit() }}
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
  //all prices are free
  if(props.bookable.priceCategories.every((c) => c.priceEur === 0)){
    return null;
  }
  //exclude holiday price categories
  const pricesWithoutHolidays = props.bookable.priceCategories.filter(
    (c) => c.holidays.length === 0,
  );

  return Math.min(...pricesWithoutHolidays.map((c) => c.priceEur));
}
function displayMinDefaultPrice() {
  if (
    props.bookable.priceCategories &&
    props.bookable.priceCategories.length === 0
  ) {
    return null;
  }

  const min = getMinPrice();
  if (min === null) {
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


function displayPricePerUnit() {
  const minPrice = getMinPrice();
  if (minPrice === null || minPrice === 0) {
    return "";
  }

  const includeTaxes = "(inkl. MwSt.)"
  /*if(props.bookable.priceValueAddedTax > 0){
    includeTaxes = "(inkl. MwSt.)"
  }*/

  switch (props.bookable.priceType) {
    case "per-hour":
      return " pro Stunde " + includeTaxes;
    case "per-item":
      return " pro Stück " + includeTaxes;
    case "per-day":
      return " pro Tag " + includeTaxes;
  }
}

</script>

<style scoped></style>

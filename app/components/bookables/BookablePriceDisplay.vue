<template>
  <div>
    <p
      v-if="props.price && price.regularGrossPriceEur > price.userGrossPriceEur"
    >
      <span class="text-gray-500 line-through mr-2">
        {{ displayPrice(price.regularGrossPriceEur) }}
      </span>
      <span>
        {{ displayPrice(price.userGrossPriceEur) }}
      </span>
    </p>
    <p v-else>
      {{ displayPrice(price?.regularGrossPriceEur || null) }}
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  price: {
    type: Object,
    default: null,
  },
});

function displayPrice(currentPrice) {
  if (!currentPrice) {
    return "Kein Preis bekannt.";
  } else {
    currentPrice = currentPrice.toFixed(2)
    return "€ " + currentPrice.toString().replace(/\./g, ",");
  }
}
</script>

<style scoped></style>

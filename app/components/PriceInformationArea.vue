<template>
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
    <p class="font-bold">{{ $t("price.information") }}</p>
    <p
      v-if="props.item.priceValueAddedTax"
      class="text-gray-500 text-sm italic"
    >
      {{ $t("price.allInclVat") }}
    </p>

    <EventPriceInformation v-if="isEvent" :event="item" />
    <BookablePriceInformation v-else :item="item" />
  </div>
</template>
<script setup>
import EventPriceInformation from "~/components/events/EventPriceInformation.vue";
import BookablePriceInformation from "~/components/bookables/BookablePriceInformation.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});
</script>
<style scoped></style>

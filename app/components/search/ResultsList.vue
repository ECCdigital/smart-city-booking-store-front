<template>
  <div>
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UPageList>
      <ResultStrip
          v-for="(b, i) in suitableBookables"
          :key="i"
          :item="b.item"
          :calculated-price="b.calculatedPrice"
          :search-params="searchParams"
          class="m-2"
      />
    </UPageList>

    <!-- Nicht passende Ergebnisse -->
    <h2
      v-if="includeNonSuitable && nonSuitableBookables.length > 0"
      class="text-2xl font-bold m-4 mt-7"
    >
      Nicht passende Objekte
    </h2>
    <UPageList>
      <ResultStrip
          v-for="(b, i) in nonSuitableBookables"
          :key="i"
          :item="b.item"
          :search-params="searchParams"
          is-not-bookable
          class="m-2"
      />
    </UPageList>

    <p v-if="bookables.length < 1">Keine Objekte gefunden.</p>
  </div>
</template>
<script setup>
import ResultStrip from "~/components/search/ResultStrip.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  searchParams: {
    type: Object,
    default: null,
  },
  includeNonSuitable: {
    type: Boolean,
    default: false,
  },
  includeNonBookable: {
    type: Boolean,
    default: false,
  },
  isEventList: {
    type: Boolean,
    default: false,
  },
});

const suitableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "suitable"),
);

const nonSuitableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "nonSuitable"),
);
</script>

<style scoped></style>

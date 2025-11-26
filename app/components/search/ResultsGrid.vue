<template>
  <div>
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UPageList v-if="suitableBookables.length > 0" class="m-5 space-y-5">
      <ResultCard
          v-for="(b, i) in suitableBookables"
          :key="i"
          :item="b.item"
          :calculated-price="b.calculatedPrice"
          :search-params="searchParams"
      />
    </UPageList>

    <!-- Nicht passende Ergebnisse -->
    <div v-if="nonSuitableBookables.length > 0" >
      <h2 v-if="includeNonSuitable" class="text-2xl font-bold m-5 mt-7">
        Nicht passende Objekte
      </h2>
      <UPageList class="m-5">
        <ResultCard
            v-for="(b, i) in nonSuitableBookables"
            :key="i"
            :item="b.item"
            :calculated-price="b.calculatedPrice"
            :search-params="searchParams"
            is-not-bookable
            class="mb-5"
        />
      </UPageList>
    </div>

    <p v-if="bookables.length < 1">Keine Objekte gefunden.</p>
  </div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";

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
  isEventGrid: {
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

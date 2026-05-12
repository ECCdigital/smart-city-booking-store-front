<template>
  <div>
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UPageList>
      <ResultStrip
        v-for="(b, i) in suitableBookables"
        :key="i"
        :item="b.item"
        :is-not-bookable="!b.isBookable"
        :calculated-price="b.calculatedPrice"
        :entry-page-mode="entryPageMode"
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
        is-not-suitable
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
  entryPageMode: {
    type: Boolean,
    default: false,
  },
});

const suitableBookables = computed(() =>
  props.bookables.filter(
    (b) => b.matchStatus === "match",
  ),
);

const nonSuitableBookables = computed(() =>
  props.bookables
    .filter(
      (b) => b.matchStatus === "no-match" || b.matchStatus === "too-far",
    )
    .sort((a, b) =>
        a.matchStatus === "too-far"
        ? -1
        : b.matchStatus === "too-far"
          ? 1
          : 0,
    ),
);
</script>

<style scoped></style>

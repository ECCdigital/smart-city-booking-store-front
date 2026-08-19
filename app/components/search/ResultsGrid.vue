<template>
  <div>
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UPageList v-if="suitableBookables.length > 0" class="my-2 md:my-5 space-y-5">
      <ResultCard
          v-for="(b, i) in suitableBookables"
          :key="i"
          :item="b.item"
          :is-not-bookable="!b.isBookable"
          :calculated-price="b.calculatedPrice"
          :entry-page-mode="entryPageMode"
      />
    </UPageList>

    <!-- Nicht passende Ergebnisse -->
    <div v-if="nonSuitableBookables.length > 0" >
      <h2 v-if="includeNonSuitable" class="text-2xl font-bold my-5 mt-7">
        Nicht passende Objekte
      </h2>
      <UPageList class="my-5">
        <ResultCard
            v-for="(b, i) in nonSuitableBookables"
            :key="i"
            :item="b.item"
            :calculated-price="b.calculatedPrice"
            is-not-suitable
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

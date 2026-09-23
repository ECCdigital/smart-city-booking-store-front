<template>
  <div ref="resultsRoot">
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UPageList v-if="pagedSuitable.length > 0">
      <ResultStrip
        v-for="(b, i) in pagedSuitable"
        :key="b.item?.id ?? i"
        :item="b.item"
        :is-not-bookable="!b.isBookable"
        :calculated-price="b.calculatedPrice"
        :entry-page-mode="entryPageMode"
        :eager="i === 0"
        class="my-2"
      />
    </UPageList>

    <!-- Nicht passende Ergebnisse -->
    <div v-if="pagedNonSuitable.length > 0">
      <h2 class="text-2xl font-bold my-4 mt-7">{{ $t("filter.nonSuitable") }}</h2>
      <UPageList>
        <ResultStrip
          v-for="(b, i) in pagedNonSuitable"
          :key="b.item?.id ?? i"
          :item="b.item"
          is-not-suitable
          class="my-2"
        />
      </UPageList>
    </div>

    <ResultsPagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :total="total"
      :items-per-page="itemsPerPage"
      :page-count="pageCount"
      :first-item-on-page="firstItemOnPage"
      :last-item-on-page="lastItemOnPage"
    />

    <p v-if="bookables.length < 1">{{ $t("filter.noResults") }}</p>
  </div>
</template>
<script setup>
import ResultStrip from "~/components/search/ResultStrip.vue";
import ResultsPagination from "~/components/search/ResultsPagination.vue";
import { useResultPagination } from "~/composables/search/useResultPagination.js";

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

const resultsRoot = ref(null);

const suitableBookables = computed(() =>
  props.bookables.filter((b) => b.matchStatus === "match"),
);

const nonSuitableBookables = computed(() =>
  props.bookables
    .filter((b) => b.matchStatus === "no-match" || b.matchStatus === "too-far")
    .sort((a, b) =>
      a.matchStatus === "too-far" ? -1 : b.matchStatus === "too-far" ? 1 : 0,
    ),
);

// One sequence in the order it is read: the matching results first, the ones
// that missed the criteria behind them. The pagination slices exactly this, so
// a page break may fall inside either group.
const displayedBookables = computed(() => [
  ...suitableBookables.value,
  ...(props.includeNonSuitable ? nonSuitableBookables.value : []),
]);

const {
  page,
  pageSize,
  itemsPerPage,
  pageCount,
  total,
  pagedItems,
  firstItemOnPage,
  lastItemOnPage,
} = useResultPagination(displayedBookables, { scrollTarget: resultsRoot });

const pagedSuitable = computed(() =>
  pagedItems.value.filter((b) => b.matchStatus === "match"),
);

const pagedNonSuitable = computed(() =>
  pagedItems.value.filter((b) => b.matchStatus !== "match"),
);
</script>

<style scoped></style>

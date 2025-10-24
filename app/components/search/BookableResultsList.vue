<template>
  <div>
    <UPageList>
      <BookableResultStrip
        v-for="(b, i) in suitableBookables"
        :key="i"
        :bookable="b.bookable"
        :price="b.calculatedPrice"
        class="m-2"
      />
    </UPageList>
    <h2 v-if="includeNonSuitable && nonSuitableBookables.length > 0" class="text-2xl font-bold m-4 mt-7">
      Nicht passende Objekte
    </h2>
    <UPageList>
      <BookableResultStrip
          v-for="(b, i) in nonSuitableBookables"
          :key="i"
          :bookable="b.bookable"
          is-not-bookable
          class="m-2"
      />
    </UPageList>
    <h2 v-if="includeNonBookable && nonBookableBookables.length > 0" class="text-2xl font-bold m-4 mt-7">
      Nicht buchbare Objekte
    </h2>
    <UPageList>
      <BookableResultStrip
          v-for="(b, i) in nonBookableBookables"
          :key="i"
          :bookable="b.bookable"
          is-not-bookable
          class="m-2"
      />
    </UPageList>
    <p v-if="bookables.length <1">Keine Locations gefunden.</p>

  </div>
</template>
<script setup>
import BookableResultStrip from "./BookableResultStrip.vue";

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
});

const suitableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "suitable"),
);

const nonSuitableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "nonSuitable"),
);

const nonBookableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "nonBookable"),
);
</script>

<style scoped></style>

<template>
  <div>
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UPageList v-if="!isEventList">
      <BookableResultStrip
        v-for="(b, i) in suitableBookables"
        :key="i"
        :bookable="b.item"
        :calculated-price="b.calculatedPrice"
        class="m-2"
      />
    </UPageList>
    <UPageList v-else>
      <EventResultStrip
        v-for="(event, i) in suitableBookables"
        :key="i"
        :event="event.item"
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
    <UPageList v-if="!isEventList">
      <BookableResultStrip
        v-for="(b, i) in nonSuitableBookables"
        :key="i"
        :bookable="b.item"
        is-not-bookable
        class="m-2"
      />
    </UPageList>
    <UPageList v-else>
      <EventResultStrip
        v-for="(event, i) in nonSuitableBookables"
        :key="i"
        :event="event.item"
        class="m-2"
      />
    </UPageList>

    <!-- Nicht buchbare Ergebnisse -->
    <h2
      v-if="includeNonBookable && nonBookableBookables.length > 0"
      class="text-2xl font-bold m-4 mt-7"
    >
      Nicht buchbare Objekte
    </h2>
    <UPageList v-if="!isEventList">
      <BookableResultStrip
        v-for="(b, i) in nonBookableBookables"
        :key="i"
        :bookable="b.item"
        is-not-bookable
        class="m-2"
      />
    </UPageList>
    <UPageList v-else>
      <EventResultStrip
        v-for="(event, i) in nonBookableBookables"
        :key="i"
        :event="event.item"
        class="m-2"
      />
    </UPageList>

    <p v-if="bookables.length < 1">Keine Objekte gefunden.</p>
  </div>
</template>
<script setup>
import BookableResultStrip from "./BookableResultStrip.vue";
import EventResultStrip from "~/components/search/EventResultStrip.vue";

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

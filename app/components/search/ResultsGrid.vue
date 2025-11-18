<template>
  <div>
    <!-- Passende Ergebnisse & Default Anzeige -->
    <UBlogPosts v-if="suitableBookables.length > 0 && !isEventGrid" class="m-5">
      <BookableResultCard
        v-for="(b, i) in suitableBookables"
        :key="i"
        :bookable="b.item"
        :calculated-price="b.calculatedPrice"
      />
    </UBlogPosts>
    <UBlogPosts v-if="suitableBookables.length > 0 && isEventGrid" class="m-5">
      <EventResultCard
        v-for="(event, i) in suitableBookables"
        :key="i"
        :event="event.item"
      />
    </UBlogPosts>

    <!-- Nicht passende Ergebnisse -->
    <div v-if="nonSuitableBookables.length > 0">
      <h2 v-if="includeNonSuitable" class="text-2xl font-bold m-4 mt-7">
        Nicht passende Objekte
      </h2>
      <UPageList v-if="!isEventGrid">
        <BookableResultCard
          v-for="(b, i) in nonSuitableBookables"
          :key="i"
          :bookable="b.item"
          is-not-bookable
          class="m-2"
        />
      </UPageList>
      <UPageList v-if="isEventGrid">
        <EventResultCard
          v-for="(event, i) in nonSuitableBookables"
          :key="i"
          :event="event.item"
        />
      </UPageList>
    </div>

    <p v-if="bookables.length < 1">Keine Locations gefunden.</p>
  </div>
</template>
<script setup>
import BookableResultCard from "./BookableResultCard.vue";
import EventResultCard from "~/components/search/EventResultCard.vue";

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
});

const suitableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "suitable"),
);

const nonSuitableBookables = computed(() =>
  props.bookables.filter((b) => b.status === "nonSuitable"),
);
</script>

<style scoped></style>

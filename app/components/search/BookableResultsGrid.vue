<template>
  <div>
    <div class="flex items-center m-5">
      <span>{{ bookables.length }} passende Ergebnisse</span>
      <div style="flex: 1"></div>
      <UButton
        label="Filtern"
        icon="i-lucide-funnel"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="onFilter"
      />
      <UButton
        label="Sortieren"
        icon="i-lucide-arrow-up-down"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="onSort"
      />
    </div>
    <div class="m-5">
      <UBlogPosts v-if="bookables?.length">
        <BookableResultCard v-for="b in bookables" :bookable="b" />
      </UBlogPosts>
      <p v-else>Keine Locations gefunden.</p>
    </div>
  </div>
</template>
<script setup>
import BookableResultCard from "./BookableResultCard.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(["filter", "sort"]);

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

function onFilter() {
  emit("filter");
}
function onSort() {
  emit("sort");
}
</script>

<style scoped></style>

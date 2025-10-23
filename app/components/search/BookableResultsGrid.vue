<template>
  <UBlogPosts v-if="bookables?.length" class="m-5">
    <BookableResultCard v-for="b in bookables" :bookable="b" />
  </UBlogPosts>
  <p v-else>Keine Locations gefunden.</p>
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

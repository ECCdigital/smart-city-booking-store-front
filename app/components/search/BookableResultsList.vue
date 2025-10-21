<template>
  <UPageList>
    <BookableResultStrip v-for="b in bookables" :bookable="b" class="m-2" />
  </UPageList>
</template>
<script setup>
import BookableResultStrip from "./BookableResultStrip.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(["filter", "sort"]);

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);
</script>

<style scoped></style>

<template>
  <div>
    <div v-if="item.relatedBookables?.length" id="relatedBookables">
      <h3 class="text-base font-bold">
        {{ $t("bookableDetail.relatedTitle") }}
      </h3>
    </div>
    <BookableRelatedItems :related-bookables="item.relatedBookables" />
  </div>
</template>
<script setup>
import BookableRelatedItems from "~/components/bookables/BookableRelatedItems.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped></style>

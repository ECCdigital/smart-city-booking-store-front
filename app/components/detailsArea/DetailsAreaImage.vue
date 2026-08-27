<template>
  <div class="relative">
    <BookableDetailImage :item="item" :is-event="isEvent" />

    <div
      v-if="itemType"
      class="absolute top-3 left-3 z-10 flex flex-wrap gap-2"
    >
      <BookableTypeBadge :type="itemType" />
    </div>
  </div>
</template>

<script setup>
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import BookableDetailImage from "~/components/bookables/BookableDetailImage.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const itemType = computed(() => {
  if (props.isEvent) return "event";
  return props.item?.type;
});
</script>

<style scoped></style>

<template>
  <div class="pb-[50px]">
    <DetailsAreaContent :item="props.item" :is-event="isEvent" />
  </div>
</template>

<script setup>
import DetailsAreaContent from "~/components/search/DetailsAreaContent.vue";

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
</script>

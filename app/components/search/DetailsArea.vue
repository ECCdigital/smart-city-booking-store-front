<template>
  <div class="px-2 pb-[50px]">
    <div class="my-5 flex items-center gap-3">
      <BackButton />
    </div>

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

<template>
  <div class="flex justify-center">
    <div
      class="mt-2 md:-mt-10 bg-surface-muted/30 backdrop-blur-lg shadow-lg rounded-md overflow-hidden w-[100vw] md:w-[50vw]"
      style="max-width: 1000px; aspect-ratio: 16/9"
    >
      <img
        v-if="!props.isEvent && item?.imgUrl"
        :src="`/api/img?url=${encodeURIComponent(item.imgUrl)}`"
        alt=""
        class="w-full h-full object-contain rounded-l-xl"
      >
      <img
        v-else-if="props.isEvent && item?.information?.teaserImage"
        :src="`/api/img?url=${encodeURIComponent(
          item.information.teaserImage
        )}`"
        alt=""
        class="w-full h-full object-contain rounded-l-xl"
      >
      <ClientOnly v-else>
        <ImagePlaceholder :theme="colorMode.value" variant="poly" />
        <template #fallback>
          <div
            class="w-full h-full rounded-l-xl bg-surface-muted animate-pulse"
          />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
<script setup>
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";

const colorMode = useColorMode();

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

<style scoped></style>
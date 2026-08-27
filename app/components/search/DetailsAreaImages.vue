<template>
  <div class="flex justify-center">
    <div
      class="mt-2 md:-mt-10 bg-gray-300/30 dark:bg-gray-800/30 backdrop-blur-lg shadow-lg rounded-md overflow-hidden w-[80vw] md:w-[45vw]"
      style="max-width: 800px; aspect-ratio: 16/9"
    >
      <img
        v-if="image"
        v-bind="image"
        alt=""
        class="w-full h-full object-contain rounded-l-xl"
      />
      <ClientOnly v-else>
        <ImagePlaceholder :theme="colorMode.value" variant="poly" />
        <template #fallback>
          <div
            class="w-full h-full rounded-l-xl bg-gray-200 dark:bg-gray-800 animate-pulse"
          />
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
<script setup>
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import { useMediaImage } from "~/composables/utils/useMediaImage";

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

const { imageSource } = useMediaImage();

const image = computed(() =>
  imageSource(
    props.isEvent
      ? props.item?.information?.teaserImage
      : props.item?.imgUrl,
    "panel",
  ),
);
</script>

<style scoped></style>

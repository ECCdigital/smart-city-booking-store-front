<template>
  <div
    class="bg-gray-300/30 dark:bg-gray-800/30 backdrop-blur-lg shadow-lg rounded-md overflow-hidden w-full"
    :style="{ aspectRatio }"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="altText"
      class="w-full h-full object-cover"
    />
    <ClientOnly v-else>
      <ImagePlaceholder :theme="colorMode.value" variant="poly" />
      <template #fallback>
        <div class="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
  aspectRatio: {
    type: String,
    default: "16 / 9",
  },
});

const imageUrl = computed(() => {
  if (props.isEvent && props.item.information?.teaserImage) {
    return `/api/img?url=${encodeURIComponent(props.item.information.teaserImage)}`;
  } else if (props.item?.imgUrl) {
    return `/api/img?url=${encodeURIComponent(props.item.imgUrl)}`;
  } else {
    return "";
  }
});
const altText = computed(() => {
  if (props.isEvent) {
    return props.item.information.name;
  } else if (props.item.title) {
    return props.item.title;
    //item?.title || ''
  }
  return "";
});

const colorMode = useColorMode();
</script>

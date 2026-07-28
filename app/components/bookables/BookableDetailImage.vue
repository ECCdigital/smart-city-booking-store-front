<template>
  <div
    class="bg-gray-300/30 dark:bg-gray-800/30 backdrop-blur-lg shadow-lg rounded-md overflow-hidden w-full"
    :style="{ aspectRatio }"
  >
    <img
      v-if="imageUrl && !showImageErrorHint"
      :src="imageUrl"
      :alt="altText"
      class="w-full h-full object-cover"
      @error="onImageError"
    />
    <ClientOnly v-else>
      <div
        class="@container w-full h-full flex items-center justify-center relative"
      >
        <ImagePlaceholder :theme="theme" class="w-full h-full rounded-l-sm" />
        <div v-if="showImageErrorHint" class="absolute text-center">
          <UIcon
            name="i-lucide-image-off"
            :class="iconOnly ? 'w-8 h-8' : 'w-4 h-4'"
          />
          <p v-if="!iconOnly" class="text-xs">Nicht gefunden</p>
        </div>
      </div>
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
  }
  return "";
});

const colorMode = useColorMode();
const theme = computed(() => {
  if (colorMode.value === "dark") return "dark";
  if (colorMode.value === "light") return "light";
  return "light";
});

const showImageErrorHint = ref(false);

function onImageError() {
  console.log("*_** Image failed to load:", imageUrl.value);
  showImageErrorHint.value = true;
}
</script>

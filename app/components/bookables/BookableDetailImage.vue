<template>
  <div class="space-y-2">
    <div
      class="bg-gray-300/30 dark:bg-gray-800/30 backdrop-blur-lg shadow-lg rounded-md overflow-hidden w-full"
      :style="{ aspectRatio }"
    >
      <img
        v-if="activeImage && !showImageErrorHint"
        v-bind="activeImage"
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

    <!-- The bookable's image list, cover first. Only shown once there is more
         than one image to choose from. -->
    <div
      v-if="images.length > 1"
      class="flex gap-2 overflow-x-auto"
      :aria-label="$t('bookableDetail.gallery.label')"
      role="group"
    >
      <button
        v-for="(image, index) in images"
        :key="index"
        type="button"
        class="w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-colors cursor-pointer"
        :class="
          index === activeIndex
            ? 'border-primary'
            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
        "
        :aria-label="$t('bookableDetail.gallery.showImage', { index: index + 1 })"
        :aria-current="index === activeIndex"
        @click="activeIndex = index"
      >
        <img
          v-bind="thumbnailOf(image)"
          alt=""
          loading="lazy"
          decoding="async"
          class="w-full h-full object-cover"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import { useMediaImage } from "~/composables/utils/useMediaImage";

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

const { imageSource } = useMediaImage();

/**
 * The images to offer, in the order the backend exports them — position 0 is
 * the cover image.
 *
 * Only bookables carry a typed image list. An event has a single teaser image;
 * its `images` field is a legacy array the media library has not typed, so it
 * is not read here.
 */
const images = computed(() => {
  if (props.isEvent) {
    const teaser = props.item?.information?.teaserImage;
    return teaser ? [teaser] : [];
  }

  const list = Array.isArray(props.item?.images) ? props.item.images : [];
  if (list.length > 0) return list;

  // A bookable the media import has not touched yet only has its legacy
  // single image, exported as `imgUrl`.
  return props.item?.imgUrl ? [props.item.imgUrl] : [];
});

const activeIndex = ref(0);

const activeImage = computed(() =>
  imageSource(images.value[activeIndex.value], "hero"),
);

function thumbnailOf(image) {
  return imageSource(image, "thumbnail");
}

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
  showImageErrorHint.value = true;
}

// A different image gets its own chance to load, and a new item starts over.
watch(activeImage, () => {
  showImageErrorHint.value = false;
});
watch(images, () => {
  activeIndex.value = 0;
});
</script>

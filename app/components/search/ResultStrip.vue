<template>
  <div
    v-if="props.item"
    class="bg-gray-200 dark:bg-gray-700 flex flex-row rounded-sm"
    :class="[
      isNotSuitable ? 'opacity-70' : ' ',
      isEvent ? 'max-h-100 h-100' : mapMode ? '' : 'max-h-74 h-74',
    ]"
  >
    <div class="basis-1/4 flex items-center">
      <div class="basis-9/10 w-full h-full relative">
        <BookableTypeBadge
          :type="item?.type"
          :is-event="isEvent"
          :icon-only="iconOnly"
          class="absolute"
          :class="mapMode ? 'top-1 left-1' : 'top-2 left-2'"
        />

        <img
          v-if="!isEvent && item?.imgUrl && !showImageErrorHint"
          :src="`/api/img?url=${encodeURIComponent(item.imgUrl)}`"
          alt=""
          class="w-full h-full object-cover rounded-l-sm"
          @error="onImageError"
        >
        <img
          v-else-if="
            isEvent && item?.information?.teaserImage && !showImageErrorHint
          "
          :src="`/api/img?url=${encodeURIComponent(
            item.information.teaserImage,
          )}`"
          alt=""
          class="w-full h-full object-cover rounded-l-sm"
          @error="onImageError"
        >
        <ClientOnly v-else>
          <div
            class="@container w-full h-full flex items-center justify-center relative"
          >
            <ImagePlaceholder
              :theme="theme"
              class="w-full h-full rounded-l-sm"
            />
            <div class="absolute text-center">
              <UIcon
                name="i-lucide-image-off"
                :class="iconOnly ? 'w-8 h-8' : 'w-4 h-4'"
              />
              <p v-if="!iconOnly" class="text-xs">Nicht gefunden</p>
            </div>
          </div>
        </ClientOnly>
      </div>

      <USeparator
        orientation="vertical"
        color="primary"
        type="solid"
        size="xl"
      />
    </div>
    <ResultStripBookableContent
      v-if="!isEvent"
      :bookable="item"
      :calculated-price="price"
      :is-not-suitable="isNotSuitable"
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
      :map-mode="mapMode"
    />
    <ResultStripEventContent
      v-if="isEvent"
      :event="item"
      :is-not-suitable="isNotSuitable"
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
    />
  </div>
</template>
<script setup>
import ResultStripEventContent from "~/components/search/ResultStripEventContent.vue";
import ResultStripBookableContent from "~/components/search/ResultStripBookableContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";

const colorMode = useColorMode();

const theme = computed(() => {
  if (colorMode.value === "dark") return "dark";
  if (colorMode.value === "light") return "light";
  return "light";
});

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  calculatedPrice: {
    type: Object,
    default: null,
  },
  isNotSuitable: {
    type: Boolean,
    default: false,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
  entryPageMode: {
    type: Boolean,
    default: false,
  },
  mapMode: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
});

const isEvent = computed(() => {
  return props.item.type === "event";
  //return !("type" in props.item);
});

const price = computed(() => {
  if (props.entryPageMode) {
    return null;
  }
  return props.calculatedPrice;
});

const showImageErrorHint = ref(false);

function onImageError() {
  showImageErrorHint.value = true;
}
</script>

<style scoped></style>

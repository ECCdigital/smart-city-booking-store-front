<template>
  <div
    v-if="props.item"
    class="@container bg-white dark:bg-gray-700 flex flex-row rounded-sm shadow-lg"
    :class="[
      isNotSuitable ? 'opacity-70' : ' ',
      listMode ? 'min-h-48' : isEvent ? 'max-h-100 h-100' : '',
    ]"
  >
    <div
      class="w-24 shrink-0 @sm:basis-1/4 flex"
      :class="listMode ? 'items-stretch' : 'items-center'"
    >
      <div
        class="basis-9/10 w-full h-full relative cursor-pointer"
        @click="onOpenDetails(item?.id, item?.type)"
      >
        <BookableTypeBadge
          :type="item?.type"
          :is-event="isEvent"
          :icon-only="iconOnly"
          class="absolute z-10"
          :class="mapMode ? 'top-1 left-1' : 'top-2 left-2'"
        />

        <img
          v-if="image && !showImageErrorHint"
          v-bind="image"
          alt=""
          :loading="eager ? 'eager' : 'lazy'"
          class="w-full object-cover rounded-l-sm"
          :class="
            mapListMode
              ? 'h-24'
              : listMode
                ? 'absolute inset-0 h-full'
                : 'h-full'
          "
          @error="onImageError"
        />
        <ClientOnly v-else>
          <div
            class="@container w-full h-full flex items-center justify-center"
            :class="listMode ? 'absolute inset-0' : 'relative'"
          >
            <ImagePlaceholder
              :theme="theme"
              class="w-full h-full rounded-l-sm"
            />
            <div v-if="showImageErrorHint" class="absolute text-center">
              <UIcon
                name="i-lucide-image-off"
                :class="iconOnly ? 'w-8 h-8' : 'w-4 h-4'"
              />
              <p v-if="!iconOnly" class="text-xs">{{ $t("bookableDetail.notFound") }}</p>
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
      :map-list-mode="mapListMode"
      class="w-auto"
      @open-details="onOpenDetails"
    />
    <ResultStripEventContent
      v-if="isEvent"
      :event="item"
      :is-not-suitable="isNotSuitable"
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
      @open-details="onOpenDetails"
    />
  </div>
</template>
<script setup>
import ResultStripEventContent from "~/components/search/ResultStripEventContent.vue";
import ResultStripBookableContent from "~/components/search/ResultStripBookableContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import { useRedirection } from "~/composables/utils/useRedirection.js";
import { useMediaImage } from "~/composables/utils/useMediaImage";


const colorMode = useColorMode();
const { coverImageOf, imageSource } = useMediaImage();

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
  mapListMode: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  // The first strip of a list is above the fold and is usually the LCP
  // element, so its image must not be deferred.
  eager: {
    type: Boolean,
    default: false,
  },
});

const { goToDetails } = useRedirection();

const isEvent = computed(() => {
  return props.item.type === "event";
});

// The plain list is the only mode that sizes itself to its content: the map
// tooltip and the map list keep their fixed boxes.
const listMode = computed(() => !props.mapMode && !props.mapListMode);

const image = computed(() =>
  imageSource(coverImageOf(props.item, isEvent.value), "strip"),
);

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
function onOpenDetails(id, type) {
  goToDetails(id, type);
}
</script>

<style scoped></style>

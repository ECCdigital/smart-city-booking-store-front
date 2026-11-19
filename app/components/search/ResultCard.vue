<template>
  <div
    class="shadow-lg bg-white dark:bg-gray-700 rounded-xl has-[.result-card-link:focus-visible]:ring-2 has-[.result-card-link:focus-visible]:ring-[color:var(--ui-accent,var(--ui-primary))]"
    :class="[
      isNotSuitable ? 'opacity-70 dark:opacity-50' : 'cursor-pointer',
      mapDetailMode ? 'max-h-72' : '',
    ]"
    @click="onGoToDetails"
  >
    <div
      id="header"
      :class="mapDetailMode ? 'h-28' : 'flex flex-col h-48 shrink-0'"
    >
      <div class="flex h-9/10 relative isolate">
        <BookableTypeBadge
          :type="item?.type"
          :is-event="isEvent"
          class="absolute top-2 left-2"
        />
        <FavoriteButton
          :item="item"
          :is-event="isEvent"
          overlay
          class="absolute top-2 right-2 z-10"
        />
        <img
          v-if="image && !showImageErrorHint"
          v-bind="image"
          :alt="altText"
          :loading="eager ? 'eager' : 'lazy'"
          class="w-full object-cover rounded-t-xl"
          @error="onImageError"
        />
        <ClientOnly v-else>
          <div
            class="w-full h-full rounded-t-xl flex flex-col items-center justify-center gap-2"
          >
            <ImagePlaceholder
              :theme="theme"
              class="w-full h-full rounded-t-xl"
            />
            <div
              v-if="showImageErrorHint"
              class="absolute bottom-2 left-2 right-2 flex items-center justify-center space-x-1 text-xs text-center text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 rounded px-2 py-1"
            >
              <UIcon name="i-lucide-image-off" class="w-4 h-4" />
              <p>{{ $t("common.imageLoadFailed") }}</p>
            </div>
          </div>
        </ClientOnly>
      </div>
      <USeparator
        color="primary"
        type="solid"
        size="xl"
        class="w-full"
        :ui="{ border: 'border-[color:var(--ui-accent,var(--ui-primary))]' }"
      />
    </div>
    <ResultCardBookableContent
      v-if="!isEvent"
      :bookable="item"
      :details-to="detailsTo"
      :calculated-price="calculatedPrice"
      :is-not-bookable="isNotBookable"
      :is-not-suitable="isNotSuitable"
      :entry-page-mode="entryPageMode"
      :map-detail-mode="mapDetailMode"
    />
    <ResultCardEventContent
      v-if="isEvent"
      v-model:open-ticket-options="openEventTicketOptions"
      :event="item"
      :details-to="detailsTo"
      :is-not-bookable="isNotBookable"
      :is-not-suitable="isNotSuitable"
      :entry-page-mode="entryPageMode"
      :map-detail-mode="mapDetailMode"
    />
  </div>
</template>
<script setup>
import ResultCardBookableContent from "~/components/search/ResultCardBookableContent.vue";
import ResultCardEventContent from "~/components/search/ResultCardEventContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import FavoriteButton from "~/components/favorites/FavoriteButton.vue";
import { useRedirection } from "~/composables/utils/useRedirection.js";
import { useMediaImage } from "~/composables/utils/useMediaImage";

const colorMode = useColorMode();
const { coverImageOf, imageSource } = useMediaImage();
const { detailsRoute, goToDetails } = useRedirection();

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
  mapDetailMode: {
    type: Boolean,
    default: false,
  },
  // The first card of a list is above the fold and is usually the LCP
  // element, so its image must not be deferred.
  eager: {
    type: Boolean,
    default: false,
  },
});
const isEvent = computed(() => {
  return props.item.type === "event";
});

const image = computed(() =>
  imageSource(coverImageOf(props.item, isEvent.value), "card"),
);
const altText = computed(
  () =>
    (isEvent.value ? props.item?.information?.name : props.item?.title) || "",
);

const openEventTicketOptions = ref(false);
const showImageErrorHint = ref(false);

// The title links to the detail page, so the card is reached and opened by
// keyboard and can be opened in a new tab. The map's compact cards open their
// details through the map instead and get no link.
const detailsTo = computed(() =>
  props.mapDetailMode || !props.item
    ? null
    : detailsRoute(props.item.id, props.item.type),
);

function onGoToDetails(event) {
  // A click on a link inside the card (the title) is the link's own
  // navigation, a new tab included; the card must not open the page again.
  if (event?.target?.closest?.("a")) return;
  if (!props.mapDetailMode && props.item) {
    goToDetails(props.item.id, props.item.type);
  }
}

function onImageError() {
  showImageErrorHint.value = true;
}

// Reset image error state when item changes
watch(
  () => props.item.id,
  () => {
    showImageErrorHint.value = false;
  },
);
</script>

<style scoped></style>

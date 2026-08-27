<template>
  <div
    class="shadow-lg bg-white dark:bg-gray-700 rounded-xl"
    :class="[
      isNotSuitable ? 'opacity-70 dark:opacity-50' : 'cursor-pointer',
      mapDetailMode ? 'h-80' : '',
    ]"
    @click="onGoToDetails"
  >
    <div
      id="header"
      class=""
      :class="mapDetailMode ? 'h-28' : 'flex flex-col h-48 shrink-0'"
    >
      <div class="flex h-9/10 relative">
        <BookableTypeBadge
          :type="item?.type"
          :is-event="isEvent"
          class="absolute top-2 left-2"
        />
        <img
          v-if="!isEvent && item?.imgUrl && !showImageErrorHint"
          :src="`/api/img?url=${encodeURIComponent(item?.imgUrl)}`"
          alt="Bild des Buchungsobjekts"
          class="w-full object-cover rounded-t-xl"
          @error="onImageError"
        />
        <img
          v-else-if="
            isEvent && item?.information?.teaserImage && !showImageErrorHint
          "
          :src="`/api/img?url=${encodeURIComponent(
            item.information.teaserImage,
          )}`"
          alt=""
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
              <p>Bild konnte nicht geladen werden</p>
            </div>
          </div>
        </ClientOnly>
      </div>
      <USeparator color="primary" type="solid" size="xl" class="w-full" />
    </div>
    <ResultCardBookableContent
      v-if="!isEvent"
      :bookable="item"
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
      :is-not-bookable="isNotBookable"
      :is-not-suitable="isNotSuitable"
      :entry-page-mode="entryPageMode"
    />
  </div>
</template>
<script setup>
import ResultCardBookableContent from "~/components/search/ResultCardBookableContent.vue";
import ResultCardEventContent from "~/components/search/ResultCardEventContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import { useRedirection } from "~/composables/utils/useRedirection.js";

const colorMode = useColorMode();
const { goToDetails } = useRedirection();

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
});
const isEvent = computed(() => {
  return props.item.type === "event";
});

const openEventTicketOptions = ref(false);
const showImageErrorHint = ref(false);

function onGoToDetails() {
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

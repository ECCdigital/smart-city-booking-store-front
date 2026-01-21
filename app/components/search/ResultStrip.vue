<template>
  <div
    v-if="props.item"
    class="bg-gray-200 dark:bg-gray-700 flex flex-row rounded-xl max-h-72 h-72"
    :class="[
      isNotBookable ? 'opacity-70' : ' ',
      isEvent ? 'max-h-100 h-100' : 'max-h-72 h-72',
    ]"
  >
    <div class="basis-1/4 flex items-center">
      <div class="basis-9/10 w-full h-full relative">
        <UBadge
            class="absolute top-2 left-2 z-10"
            color="primary"
            size="md"
            :label="categoryName"
        />
        <img
          v-if="!isEvent && item?.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(item.imgUrl)}`"
          alt=""
          class="w-full h-full object-cover rounded-l-xl"
        >
        <img
          v-else-if="isEvent && item?.information?.teaserImage"
          :src="`/api/img?url=${encodeURIComponent(
            item.information.teaserImage
          )}`"
          alt=""
          class="w-full h-full object-cover rounded-l-xl"
        >
        <ClientOnly v-else>
          <ImagePlaceholder :theme="theme" class="w-full h-full rounded-l-xl" />
          <template #fallback>
            <div
              class="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse"
            />
          </template>
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
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
    />
    <ResultStripEventContent
      v-if="isEvent"
      :event="item"
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
    />
  </div>
</template>
<script setup>
import ResultStripEventContent from "~/components/search/ResultStripEventContent.vue";
import ResultStripBookableContent from "~/components/search/ResultStripBookableContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";

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
  isNotBookable: {
    type: Boolean,
    default: false,
  },
  entryPageMode: {
    type: Boolean,
    default: false,
  },
});

const isEvent = computed(() => {
  return !("type" in props.item);
});

//toDo - read dynamically from instance
const categoryName = computed(() => {
  if(isEvent.value){
    return "Veranstaltung";
  }
  switch (props.item?.type){
    case "room":
      return "Raum";
    case "event-location":
      return "Veranstaltungsort";
    case "resource":
      return "Gerät";
    case "event":
      return "Veranstaltung";
    default:
      return "";
  }
});

const price = computed(() => {
      if (props.entryPageMode) {
        return null;
      }
      return props.calculatedPrice
    }
)
</script>

<style scoped></style>

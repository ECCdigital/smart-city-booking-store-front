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
      <div class="basis-9/10 w-full h-full">
        <img
          v-if="!isEvent && item?.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(item.imgUrl)}`"
          alt=""
          class="w-full h-full object-cover rounded-l-xl"
        >
        <img
          v-else-if="isEvent && item?.information?.teaserImage"
          :src="`/api/img?url=${encodeURIComponent(item.information.teaserImage)}`"
          alt=""
          class="w-full h-full object-cover rounded-l-xl"
        >
        <img
          v-else
          src="../../assets/bookable-default.jpg"
          alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
          class="h-full w-full object-cover rounded-l-xl"
        >
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
      :calculated-price="calculatedPrice"
      :is-not-bookable="isNotBookable"
    />
    <ResultStripEventContent
      v-if="isEvent"
      :event="item"
      :is-not-bookable="isNotBookable"
    />
  </div>
</template>
<script setup>
import ResultStripEventContent from "~/components/search/ResultStripEventContent.vue";
import ResultStripBookableContent from "~/components/search/ResultStripBookableContent.vue";

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
});

const isEvent = computed(() => {
  if ("type" in props.item) {
    return false;
  } else {
    return true;
  }
});
</script>

<style scoped></style>

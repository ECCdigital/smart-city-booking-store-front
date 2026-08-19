<template>
  <LTooltip :options="{ className: 'clean-tooltip' }" class="hidden md:block">
    <div
      v-if="group.bookables?.length === 1"
      class="overflow-hidden rounded-2xl shadow-2xl"
    >
      <ResultCard
        :item="group.bookables[0].item"
        :is-not-bookable="!group.bookables[0].isBookable"
        :calculated-price="group.bookables[0].calculatedPrice"
        map-detail-mode
        class="w-[300px] break-normal"
      />
    </div>

    <div
      v-else-if="group.bookables?.length === 2 || group.bookables?.length === 3"
      class="rounded-2xl bg-white shadow-2xl p-2 space-y-1"
    >
      <div v-for="bookable in group.bookables" :key="bookable.item.id" class="">
        <ResultStrip
          :item="bookable.item"
          :is-not-suitable="bookable.matchStatus !== 'match'"
          :calculated-price="bookable.calculatedPrice"
          map-mode
          icon-only
          class="h-36 w-85"
        />
      </div>
    </div>

    <div v-else class="rounded-2xl bg-white shadow-2xl p-2 w-80">
      <p class="text-md font-bold mb-2">
        {{ group.bookables.length }} Ergebnisse an diesem Standort:
      </p>
      <div
        v-for="bookable in group.bookables"
        :key="bookable.item.id"
        class="bg-gray-200 dark:bg-gray-700 rounded-sm mb-2 last:mb-0 p-1 flex"
        :class="bookable.matchStatus !== 'match' ? 'opacity-70' : ''"
      >
        <div class="basis-1/8 flex items-center">
          <BookableTypeBadge :type="bookable.item?.type" icon-only />
        </div>
        <div class="basis-7/8 flex items-center">
          <div class="font-semibold wrap-break-word whitespace-normal">
            {{ bookable.item?.title }}
          </div>
        </div>
      </div>

      <p class="text-center italic">[ Klick um Auswahl zu öffnen ]</p>
    </div>
  </LTooltip>
</template>
<script setup>
import ResultStrip from "~/components/search/ResultStrip.vue";
import ResultCard from "~/components/search/ResultCard.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";

defineProps({
  group: {
    type: Object,
    required: true,
  },
});
</script>

<style>
.leaflet-tooltip.clean-tooltip {
  background: transparent;
  border: none;
  border-radius: 50px;
  box-shadow: 5px;
  padding: 0;
  color: #000;
}

.leaflet-tooltip.clean-tooltip::before {
  display: none;
}

.leaflet-div-icon {
  background: transparent;
  border: transparent;
}
</style>

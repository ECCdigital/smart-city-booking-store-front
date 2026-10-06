<template>
  <!-- Interactive, so the pointer may move from the pin into the tooltip: the
       strips and the icon badges in it have hover states of their own. -->
  <LTooltip
    :options="{ className: 'clean-tooltip', interactive: true }"
    class="hidden md:block"
  >
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

    <!-- Each strip sizes to its content and is clipped; a fixed height with
         more content than fits is what made them paint over each other. -->
    <div
      v-else-if="group.bookables?.length === 2 || group.bookables?.length === 3"
      class="rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-2 space-y-1 w-85"
    >
      <div
        v-for="bookable in group.bookables"
        :key="bookable.item.id"
        class="overflow-hidden rounded-sm"
      >
        <ResultStrip
          :item="bookable.item"
          :is-not-suitable="bookable.matchStatus !== 'match'"
          :calculated-price="bookable.calculatedPrice"
          map-mode
          icon-only
          class="w-full"
        />
      </div>
    </div>

    <div
      v-else
      class="@container rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-2 w-80"
    >
      <p class="text-md font-bold mb-2">
        {{ group.bookables.length }} {{ $t("results.atThisLocation") }}
      </p>
      <!-- For many Offers at one place the list is capped and fades out at the bottom. -->
      <div ref="listRef" class="relative max-h-80 overflow-hidden">
        <div
          v-for="bookable in group.bookables"
          :key="bookable.item.id"
          class="bg-gray-200 dark:bg-gray-700 rounded-sm mb-2 last:mb-0 p-1 flex"
          :class="bookable.matchStatus !== 'match' ? 'opacity-70' : ''"
        >
          <div class="basis-1/8 flex items-center">
            <BookableTypeBadge
              :type="bookable.item?.type"
              :is-event="bookable.item?.type === 'event'"
              icon-only
            />
          </div>
          <div class="basis-7/8 flex flex-col justify-center min-w-0">
            <div class="font-semibold wrap-break-word whitespace-normal">
              {{ titleOf(bookable.item) }}
            </div>
            <EventTimeInformation
              v-if="bookable.item?.type === 'event'"
              :event="bookable.item"
              :use-icon="false"
              class="text-xs text-gray-600 dark:text-gray-300"
            />
          </div>
        </div>
        <div
          v-if="listOverflows"
          class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-gray-800 to-transparent"
        />
      </div>

      <p class="text-center italic mt-2">
        [
        {{
          $t(listOverflows ? "results.clickToSeeAll" : "results.clickToOpen")
        }}
        ]
      </p>
    </div>
  </LTooltip>
</template>
<script setup>
import ResultStrip from "~/components/search/ResultStrip.vue";
import ResultCard from "~/components/search/ResultCard.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import { titleOf } from "~/composables/search/offer";

defineProps({
  group: {
    type: Object,
    required: true,
  },
});

const listRef = ref(null);
const listOverflows = ref(false);
useResizeObserver(listRef, ([entry]) => {
  const el = entry.target;
  listOverflows.value = el.scrollHeight > el.clientHeight;
});
</script>

<style>
.leaflet-tooltip.clean-tooltip {
  /* Leaflet setzt für .leaflet-tooltip white-space: nowrap – dadurch laufen
     lange Adressen seitlich aus der Tooltip-Karte heraus. */
  white-space: normal;
  background: transparent;
  border: none;
  border-radius: 50px;
  box-shadow: 5px;
  padding: 0;
  /* Leaflet paints its own dark grey; the cards follow the colour mode. */
  color: var(--ui-text);
}

.leaflet-tooltip.clean-tooltip::before {
  display: none;
}

.leaflet-div-icon {
  background: transparent;
  border: transparent;
}
</style>

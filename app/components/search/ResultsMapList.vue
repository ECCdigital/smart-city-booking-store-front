<template>
  <div
    :class="
      floating
        ? 'absolute right-4 top-20 bottom-4 w-80 z-20 hidden lg:flex flex-col rounded-lg bg-white dark:bg-gray-800 shadow-xl overflow-hidden glass'
        : 'bg-auto w-[280px] shrink-0 h-[80vh] z-20 my-2 ml-2 overflow-auto p-2 border border-gray-200 rounded hidden lg:block'
    "
  >
    <div
      v-if="floating"
      class="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
    >
      <p class="font-bold">{{ $t("results.inMapView") }}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{
          $t(
            "results.inMapViewCount",
            { count: bookables.length },
            bookables.length,
          )
        }}
      </p>
    </div>
    <div
      :class="floating ? 'flex-1 min-h-0 overflow-auto p-2' : 'overflow-auto'"
    >
      <TransitionGroup name="list" tag="div" class="space-y-1">
        <div
          v-for="bookable in bookables"
          :key="bookable.item.id"
          @mouseenter="currentBookable = bookable"
          @mouseleave="currentBookable = null"
        >
          <ResultStrip
            class="cursor-pointer"
            :item="bookable.item"
            :is-not-suitable="bookable.matchStatus !== 'match'"
            :calculated-price="bookable.calculatedPrice"
            map-mode
            map-list-mode
            @click="emit('openDetails', bookable, true)"
          />
        </div>
        <div v-if="!bookables || bookables.length === 0" key="empty-state">
          <p class="text-center text-gray-500 mt-10">
            {{ $t("results.noneInArea") }}
          </p>
        </div>
      </TransitionGroup>

      <!-- Offers the map cannot place: not on it, but not lost either -->
      <div
        v-if="withoutLocation.length > 0"
        class="mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600"
      >
        <p
          class="mb-2 flex items-center gap-1 text-xs tracking-wide text-gray-500"
        >
          <UIcon name="i-lucide-map-pin-off" class="size-3.5" />
          {{ $t("results.noLocation") }}
        </p>
        <div class="space-y-1 opacity-70">
          <ResultStrip
            v-for="bookable in withoutLocation"
            :key="bookable.item.id"
            class="cursor-pointer"
            :item="bookable.item"
            :is-not-suitable="bookable.matchStatus !== 'match'"
            :calculated-price="bookable.calculatedPrice"
            map-mode
            map-list-mode
            @click="emit('openDetails', bookable, true)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import ResultStrip from "~/components/search/ResultStrip.vue";

const currentBookable = defineModel({
  type: Object,
  required: false,
  default: () => {},
});
const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  withoutLocation: {
    type: Array,
    default: () => [],
  },
  floating: {
    type: Boolean,
    default: false,
  },
});

const matchCount = computed(
  () => props.bookables.filter((b) => b.matchStatus === "match").length,
);

const emit = defineEmits(["openDetails"]);
</script>

<style scoped>
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style>

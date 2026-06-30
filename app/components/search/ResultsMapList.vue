<template>
  <div
      class="bg-auto w-[25%] h-[80vh] z-20 m-2 overflow-auto p-2 border border-gray-200 rounded hidden lg:block"
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
            @click="emit('openDetails',bookable, true)"
        />
      </div>
      <div v-if="!bookables || bookables.length === 0">
        <p class="text-center text-gray-500 mt-10">
          Keine Ergebnisse in diesem Bereich.
        </p>
      </div>
    </TransitionGroup>
  </div>
</template>
<script setup >
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
});

const emit = defineEmits(["openDetails", "updateCurrentBookable"]);
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
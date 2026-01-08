<template>
  <div style="max-width: 90vw; margin: auto; padding: 50px 0">
    <div class="flex items-end mb-5">
      <h2 class="text-2xl font-bold mt-7">
        Veranstaltungen dieser Woche
      </h2>
      <p class="ml-1 mt-8">
        (
        {{currentWeek[0].toLocaleDateString()}} -
        {{currentWeek[1].toLocaleDateString()}}
        )
      </p>
      <div class="flex-1" />
      <p
          v-if="latestEvents.length > 3 && !showAllLatestEvents"
          class="text-primary text-bold"
          @click="showAllLatestEvents = true"
      >
        Alle anzeigen...
      </p>
      <p
          v-if="latestEvents.length > 3 && showAllLatestEvents"
          class="text-primary text-bold"
          @click="showAllLatestEvents = false"
      >
        Weniger anzeigen...
      </p>
    </div>

    <div class="grid space-y-2">
      <div
          v-for="(chunk, rowIdx) in chunkedLatestEventsList"
          :key="rowIdx"
          class="flex space-x-2"
      >
        <div
            v-for="(b, i) in chunk"
            :key="i"
            class="flex basis-1/3"
        >
          <ResultCard
              :item="b.item"
              :calculated-price="b.calculatedPrice"
              entry-page-mode
              class="flex flex-col h-full w-full"
          />
        </div>
        <!-- Fill empty spaces if chunk has less than 3 items -->
        <div
            v-for="n in (3 - chunk.length)"
            :key="'empty-' + n"
            class="flex basis-1/3"
            style="visibility: hidden;"
        />
      </div>
    </div>

  </div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const currentWeek = computed(() => {
  const now = new Date();
  // monday of current week
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return [monday, sunday];
})

const latestEvents = computed(() => {
const allEvents = props.items.filter((i) => i.item.category === "event");
  return allEvents.filter((e) => {
    const eventStartDate = new Date(e.item.information.startDate);
    const eventEndDate = new Date(e.item.information.endDate);
    return eventStartDate >= currentWeek.value[0] && eventEndDate <= currentWeek.value[1];
  });
});

const showAllLatestEvents = ref(false);

const latestEventsList = computed(() => {
  if (showAllLatestEvents.value) {
    return latestEvents.value;
  } else {
    return latestEvents.value.slice(0, 3);
  }
});

const chunkedLatestEventsList = computed(() => {
  const chunkSize = 3;
  const arr = latestEventsList.value;
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
});
</script>
<style scoped>

</style>
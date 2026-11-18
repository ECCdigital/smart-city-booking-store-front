<template>
  <!-- The program of an event, under the ticket options. -->
  <section v-if="program.length" aria-labelledby="event-program-heading">
    <h3 id="event-program-heading" class="text-xl font-bold mb-5">
      {{ $t("events.program") }}
    </h3>
    <ol class="space-y-3">
      <li
        v-for="(day, i) in program"
        :key="i"
        class="bg-white dark:bg-gray-700 rounded-lg p-3"
      >
        <h4 v-if="day.date || day.time" class="font-semibold">
          <span v-if="day.date">{{ dayLabel(day.date) }}</span>
          <span v-if="day.date && day.time">, </span>
          <span v-if="day.time">{{ $t("events.programTime", { time: day.time }) }}</span>
        </h4>
        <p v-if="day.description">{{ day.description }}</p>
        <ul
          v-if="day.items.length"
          class="mt-2 space-y-1 border-l-2 border-gray-300 dark:border-gray-500 pl-3"
        >
          <li v-for="(entry, j) in day.items" :key="j" class="flex gap-3">
            <span class="w-24 shrink-0 tabular-nums text-gray-600 dark:text-gray-300">
              {{ entry.time ? $t("events.programTime", { time: entry.time }) : "" }}
            </span>
            <span class="min-w-0 break-words">{{ entry.description }}</span>
          </li>
        </ul>
      </li>
    </ol>
  </section>
</template>
<script setup>
import { programOf } from "~/utils/eventPeople.js";
import { parseLocalDateIso } from "~/utils/localDate.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { formatDay } = useFormatting();

const program = computed(() => programOf(props.item));

function dayLabel(iso) {
  const date = parseLocalDateIso(iso);
  return date ? formatDay(date, { weekday: "long" }) : iso;
}
</script>
<style scoped></style>

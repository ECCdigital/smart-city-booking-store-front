<template>
  <div class="rounded-xl px-1 py-2">
    <div class="flex items-center gap-2">
      <span class="w-14 shrink-0 text-sm font-medium text-muted">Beginn</span>

      <button
        type="button"
        class="min-w-0"
        @click="openPopover = openPopover === 'date' ? null : 'date'"
      >
        <UBadge
          color="primary"
          :variant="openPopover === 'date' ? 'solid' : 'outline'"
          size="lg"
          class="tabular-nums px-3 py-1.5 rounded-md"
          :class="missedDateValidation ? 'border-red-500 border-2 m-0' : 'm-1'"
        >
          {{ date ? formatDate(date) : "tt.mm.jjjj" }}
        </UBadge>
      </button>

      <button
        type="button"
        class="min-w-0"
        @click="openPopover = openPopover === 'time' ? null : 'time'"
      >
        <UBadge
          color="primary"
          :variant="openPopover === 'time' ? 'solid' : 'outline'"
          size="lg"
          class="tabular-nums px-3 py-1.5 rounded-md"
          :class="missedTimeValidation ? 'border-red-500 border-2 m-0' : 'm-1'"
        >
          {{
            time?.hours != null && time?.minutes != null
              ? formatTime(time)
              : "--:--"
          }}
        </UBadge>
      </button>
    </div>
    <div class="flex items-center gap-3 mt-2">
      <div class="w-14" />
      <div class="space-x-1">
        <slot name="quickAccessButtons" />
      </div>
    </div>

    <div v-if="openPopover === 'date'" class="mt-3 flex justify-center">
      <DatePicker
        v-model="date"
        :range="false"
        class="w-full max-w-[20rem]"
        @update:model-value="openPopover = null"
      />
    </div>

    <div v-if="openPopover === 'time'" class="mt-3 flex justify-center">
      <TimePickerScroller
        :key="`mobile-start-${time?.hours}-${time?.minutes}`"
        :hour="time?.hours ?? new Date().getHours()"
        :minute="time?.minutes ?? 0"
        @update-hour="
          (h) =>
            (time = {
              hours: h,
              minutes: time?.minutes ?? 0,
            })
        "
        @update-minute="
          (m) =>
            (time = {
              hours: time?.hours ?? new Date().getHours(),
              minutes: m,
            })
        "
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import DatePicker from "~/components/inputs/DatePicker.vue";
import TimePickerScroller from "~/components/inputs/TimePickerScroller.vue";

type TimeHM = { hours: number | null; minutes: number | null } | null;
type PopoverKey = "date" | "time" | null;

const date = defineModel<Date | null>("date");
const time = defineModel<TimeHM | null>("time");

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  missingValues: {
    type: Array,
    required: true,
  },
});

const openPopover = ref<PopoverKey>(null);

const missedDateValidation = computed(() => {
  if (props.label === "Beginn") {
    return props.missingValues.includes("date");
  }
  return false;
});
const missedTimeValidation = computed(() => {
  if (props.label === "Beginn") {
    return props.missingValues.includes("startTime");
  }
  if (props.label === "Ende") {
    return props.missingValues.includes("endTime");
  }
  return false;
});

function formatDate(dateStr: string | number | Date) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
function formatTime(
  timeObj: { hours: number | null; minutes: number | null } | null,
) {
  if (!timeObj || timeObj.hours === null || timeObj.minutes === null) return "";
  const hours = String(timeObj.hours).padStart(2, "0");
  const minutes = String(timeObj.minutes).padStart(2, "0");
  return `${hours}:${minutes}`;
}
</script>

<style scoped></style>

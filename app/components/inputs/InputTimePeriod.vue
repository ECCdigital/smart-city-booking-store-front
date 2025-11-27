<template>
  <div class="flex justify-between w-full">
    <UModal v-model:open="isOpen">
      <UButton
        size="lg"
        color="neutral"
        variant="ghost"
        icon="i-lucide-calendar-clock"
        class="w-full text-gray-500 font-normal bg-white dark:bg-gray-700 py-2 px-3"
        :ui="{
          leadingIcon: 'text-[16px] mr-1',
        }"
        @click="setDefaultStartDate()"
      >
        <template v-if="dateRange[0]">
          <p class="text-red-800">{{dateRange}}</p>
          <p class="text-red-800">{{timeRange}}</p>

          <div class="flex justify-between w-full">
            <div class="text-black dark:text-white">
              <span>{{ displayDate(dateRange[0]) }}</span>
              <span v-if="dateRange[1] && !timeRange.start"> - </span>
              <span v-if="timeRange.start"
                >, {{ displayTime(timeRange.start) }} -</span
              >
              <span v-if="dateRange[1]"> {{ displayDate(dateRange[1]) }},</span>
              <span v-if="timeRange.end">
                {{ displayTime(timeRange.end) }}</span
              >
            </div>
          </div>
        </template>
        <template v-else> Zeitraum </template>
      </UButton>

      <template #content>
        <UCard style="max-width: 90vw">
          <div class="flex justify-between items-center">
            <p class="text-lg font-bold my-5">Zeitraum auswählen</p>
            <div>
              <UTooltip text="Schließen">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  class="rounded-xl"
                  @click="closeTimePeriodInput"
                />
              </UTooltip>
            </div>
          </div>
          <DatePicker v-model="dateRange" />
          <div class="py-3 w-full">
            <p
              class="px-1"
              :class="missingValues.includes('startTime') ? 'text-red-500' : ''"
            >
              Startuhrzeit
            </p>
            <TimePicker
              v-model="timeRange.start"
              :text-input="{ format: 'HH:mm' }"
              @update:model-value="setDefaultEndTime"
            />
            <p
              v-if="missingValues.includes('startTime')"
              class="text-red-500 text-sm"
            >
              (Bitte geben Sie eine Uhrzeit für den Beginn Ihrer Buchung an.)
            </p>
          </div>
          <div class="py-3 w-full">
            <p
              class="px-1"
              :class="missingValues.includes('endTime') ? 'text-red-500' : ''"
            >
              Enduhrzeit
            </p>
            <TimePicker
              v-model="timeRange.end"
              :text-input="{ format: 'HH:mm' }"
              :disabled="!timeRange.start"
              @update:model-value="removeValidation"
            />
            <p
              v-if="missingValues.includes('endTime')"
              class="text-red-500 text-sm"
            >
              (Bitte geben Sie eine Uhrzeit für das Ende Ihrer Buchung an.)
            </p>
          </div>

          <div class="flex justify-end">
            <UButton
              label="OK"
              variant="ghost"
              :style="
                colorMode === 'dark'
                  ? { color: lighterColor }
                  : { color: darkerColor }
              "
              @click="onSelectDate"
            />
          </div>
        </UCard>
      </template>
    </UModal>
    <UButton
      v-if="dateRange.length > 0 || timeRange.start || timeRange.end"
      color="neutral"
      variant="link"
      size="sm"
      icon="i-lucide-circle-x"
      aria-label="Clear input"
      class="mx-3"
      @click="onDeleteTimePeriod"
    />
  </div>
</template>
<script setup>
import DatePicker from "./DatePicker.vue";
import TimePicker from "./TimePicker.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useColorMode } from "@vueuse/core";

const props = defineProps({
  timePeriod: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(["selectDate", "removeDate"]);

const dateRange = ref([]);
const timeRange = ref({ start: null, end: null });

const isOpen = ref(false);
const missingValues = ref([]);

const colorMode = useColorMode();
const darkerColor = computed(() => useContrastColor().darkerColor());
const lighterColor = computed(() => useContrastColor().lighterColor());

//set default values if props are passed
function setDefaultDateRange() {
  if (props.timePeriod) {
    const newDateRange = [];
    if(props.timePeriod.startDate){
      newDateRange.push(new Date(props.timePeriod.startDate));
    }else{
      return [];
    }
    if(props.timePeriod.endDate){
      newDateRange.push(new Date(props.timePeriod.endDate));
    }
    return newDateRange;
  } else {
    return []
  }
}
function setDefaultTimeRange() {
  if (props.timePeriod) {
    const newTimeRange = { start: null, end: null };
    if(props.timePeriod.startTime){
      newTimeRange.start = {
        hours: parseInt(props.timePeriod.startTime.split(":")[0]),
        minutes: parseInt(props.timePeriod.startTime.split(":")[1]),
      }
    }
    if(props.timePeriod.endTime){
      newTimeRange.end = {
        hours: parseInt(props.timePeriod.endTime.split(":")[0]),
        minutes: parseInt(props.timePeriod.endTime.split(":")[1]),
      }
    }
    return newTimeRange;
  } else {
    return { start: null, end: null };
  }
}
watch(
  () => props.timePeriod,
  (newValue) => {
    if (newValue ) {
      dateRange.value = setDefaultDateRange();
      timeRange.value = setDefaultTimeRange();
    }
  },
  { immediate: true, deep: true },
);

//Functions to display date and time values
function displayDate(date) {
  if (!date) return "";
  date = new Date(date);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("de-DE");
}
function displayTime(time) {
  if (time) {
    return (
      time.hours.toString().padStart(2, "0") +
      ":" +
      time.minutes.toString().padStart(2, "0")
    );
  }
  return "";
}

//Functions to set default values
function closeTimePeriodInput() {
  isOpen.value = false;
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
}
function setDefaultStartDate() {
  if (!dateRange.value[0]) {
    dateRange.value[0] = new Date();
  }
}
function setDefaultEndTime() {
  removeValidation();

  if (!timeRange.value.end && timeRange.value.start) {
    const initialTime = JSON.parse(JSON.stringify(timeRange.value.start));
    initialTime.hours = initialTime.hours + 1;
    timeRange.value.end = initialTime;
  }
}
function removeValidation() {
  if (timeRange.value.start) {
    missingValues.value = missingValues.value.filter((m) => m !== "startTime");
  }
  if (timeRange.value.end) {
    missingValues.value = missingValues.value.filter((m) => m !== "endTime");
  }
}

//Functions to format date and string for search
function formateDateToString(dateObj) {
  if (!dateObj) {
    return null;
  }
  return (
    dateObj.getUTCFullYear().toString() +
    "-" +
    (dateObj.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    dateObj.getDate().toString().padStart(2, "0")
  );
}
function formatTimeToString(timeObj) {
  if (!timeObj) {
    return null;
  }
  const hours = timeObj.hours.toString().padStart(2, "0");
  const minutes = timeObj.minutes.toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function onSelectDate() {
  if (!timeRange.value.start || !timeRange.value.end) {
    if (!timeRange.value.start) {
      missingValues.value.push("startTime");
    }
    if (!timeRange.value.end) {
      missingValues.value.push("endTime");
    }
  } else {
    const selectedDate = {
      startDate: formateDateToString(dateRange.value[0]) || "",
      endDate: formateDateToString(dateRange.value[1]) || "",
      startTime: formatTimeToString(timeRange.value.start) || "",
      endTime: formatTimeToString(timeRange.value.end) || "",
    };

    isOpen.value = false;
    emit("selectDate", selectedDate);
  }
}

function onDeleteTimePeriod() {
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
  missingValues.value = [];
  emit("removeDate");
}
</script>
<style scoped></style>

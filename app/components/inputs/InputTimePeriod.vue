<template>
  <UPopover v-model:open="open" :content="{ side: 'bottom' }">
    <UButton
      size="lg"
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar-clock"
      class="w-full text-gray-400 font-normal bg-white dark:bg-white/10 py-2 px-3"
      :ui="{
        leadingIcon: 'text-[16px] mr-1',
      }"
      @click="setDefaultStartDate()"
    >
      <template v-if="model.endDate">
        {{ displayDate(model.startDate) }}, {{ displayTime(model.startTime) }}
        <br />
        - {{ displayDate(model.endDate) }},
        {{ displayTime(model.endTime) || "24:00" }}
      </template>
      <template v-else-if="!model.endDate && model.endTime">
        {{ displayDate(model.startDate) }}, {{ displayTime(model.startTime) }} -
        {{ displayTime(model.endTime) }}
      </template>
      <template v-else-if="model.startDate && !model.startTime">
        {{ displayDate(model.startDate) }}
      </template>
      <template v-else-if="model.startDate && model.startTime">
        {{ displayDate(model.startDate) }}, {{ displayTime(model.startTime) }}
      </template>

      <template v-else> Zeitraum </template>
    </UButton>
    <template #content>
      <UCard style="max-width: 90vw">
        <p class="text-lg font-bold">Zeitraum auswählen</p>
        <div class="flex flex-col md:flex-row gap-2">
          <div class="py-3 w-full">
            <p class="px-1">Startdatum</p>
            <DatePicker
              v-model="model.startDate"
              @update:model-value="setDefaultEndDate"
            />
          </div>
          <div class="py-3 w-full">
            <p class="px-1">Startuhrzeit</p>
            <TimePicker
              v-model="model.startTime"
              @update:model-value="setDefaultEndTime"
            />
          </div>
        </div>
        <div class="flex flex-col md:flex-row gap-2 mt-3">
          <div class="py-3 w-full">
            <p class="px-1">Enddatum</p>
            <DatePicker
              v-model="model.endDate"
              :min-date="model.startDate"
              :disabled="!model.startDate || !model.startTime"
            />
          </div>
          <div class="py-3 w-full">
            <p class="px-1">Enduhrzeit</p>
            <TimePicker
              v-model="model.endTime"
              :disabled="!model.startDate || !model.startTime"
            />
          </div>
        </div>
        <div class="flex justify-end">
          <UButton label="OK" variant="ghost" @click="open = false" />
        </div>
      </UCard>
    </template>
  </UPopover>
</template>
<script setup>
import DatePicker from "./DatePicker.vue";
import TimePicker from "./TimePicker.vue";

const model = defineModel();
const open = ref(false);

function displayDate(date) {
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

function setDefaultStartDate() {
  if (!model.value.startDate) {
    model.value.startDate = new Date();
  }
}
function setDefaultEndDate() {
  if (!model.value.endDate && model.value.startDate) {
    model.value.endDate = model.value.startDate;
  }
}

function setDefaultEndTime() {
  if (!model.value.endTime && model.value.startTime) {
    let initialTime = JSON.parse(JSON.stringify(model.value.startTime));
    initialTime.hours = initialTime.hours + 1;
    model.value.endTime = initialTime;
  }
}
</script>
<style scoped></style>

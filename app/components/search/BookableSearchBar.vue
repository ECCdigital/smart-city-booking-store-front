<template>
  <UCard
    variant=""
    class="bg-white mx-5 -mt-15 p-0 shadow-lg"
    :ui="{ root: 'p-0', body: 'p-0' }"
    style="position: relative; width: 80vw"
  >
    <InputText
      v-model="searchTerm"
      icon="i-lucide-search"
      placeholder="Wonach suchen Sie?"
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputText
      v-model="searchLocation"
      icon="i-lucide-map-pin"
      placeholder="Ort"
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputTimePeriod v-model="searchTimePeriod" />
    <UButton
      label="Suchen"
      class="w-full justify-center text-white"
      @click="onSearch"
    />
  </UCard>
</template>
<script setup>
import InputText from "../inputs/InputText.vue";
import InputTimePeriod from "../inputs/InputTimePeriod.vue";

const emit = defineEmits(["search"]);
const searchTerm = ref("");
const searchLocation = ref("");
const searchTimePeriod = ref({
  startDate: null,
  startTime: null,
  endDate: null,
  endTime: null,
});

function onSearch() {
  const formattedSearchTimePeriod = {
    startDate: formateDateToString(searchTimePeriod.value.startDate) || "",
    endDate: formateDateToString(searchTimePeriod.value.endDate) || "",
    startTime: formatTimeToString(searchTimePeriod.value.startTime) || "",
    endTime: formatTimeToString(searchTimePeriod.value.endTime) || "",
  };

  emit("search", {
    term: searchTerm.value,
    location: searchLocation.value,
    timePeriod: formattedSearchTimePeriod,
  });
}
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
</script>
<style scoped></style>

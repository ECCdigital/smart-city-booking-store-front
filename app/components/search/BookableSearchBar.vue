<template>
  <div
    v-if="!!isGreaterThanMd"
    class="flex justify-between bg-white -mt-5 p-2 z-100 rounded shadow-lg"
    style="position: relative; width: 60vw"
  >
    <InputText
      v-model="searchTerm"
      icon="i-lucide-search"
      placeholder="Wonach suchen Sie?"
      class=""
    />
    <USeparator orientation="vertical" />
    <InputText
      v-model="searchLocation"
      icon="i-lucide-map-pin"
      placeholder="Ort"
      class=""
    />
    <USeparator orientation="vertical" />
    <InputTimePeriod @select-date="setSearchTimePeriod" />
    <UButton
      label="Suchen"
      class="w-full justify-center text-white"
      @click="onSearch"
    />
  </div>
  <UCard
    v-else
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
    <InputTimePeriod @select-date="setSearchTimePeriod" />
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
import { useBreakpointCheck } from "../../composables/utils/useBreakpointCheck.js";

const emit = defineEmits(["search"]);
const searchTerm = ref("");
const searchLocation = ref("");
const searchTimePeriod = ref();

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());

function setSearchTimePeriod(timePeriod) {
  searchTimePeriod.value = timePeriod;
}
function onSearch() {
  emit("search", {
    term: searchTerm.value,
    location: searchLocation.value,
    timePeriod: searchTimePeriod.value,
  });
}
</script>
<style scoped></style>

<template>
  <UCard
    variant=""
    class="bg-white mx-5 -mt-15 p-0 shadow-lg"
    :ui="{ root: 'p-0', body: 'p-0' }"
    style="position: relative"
  >
    <!-- toDo - responsive machen! -->

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
    <!-- toDo - add timepicker....  -->
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
const searchTimePeriod = ref({ start: null, end: null });

function onSearch() {
  emit("search", {
    term: searchTerm.value,
    location: searchLocation.value,
  });
}
</script>
<style scoped></style>

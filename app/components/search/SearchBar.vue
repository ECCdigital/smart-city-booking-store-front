<template>
  <!-- Strip for md and larger screens -->
  <div class="hidden md:block">
    <div
      class="flex justify-between bg-white dark:bg-gray-700 z-100 rounded shadow-lg"
      :class="entryPageMode ? 'p-5 space-x-1 -mt-10' : 'p-2 -mt-5'"
      style="position: relative"
      :style="entryPageMode ? 'width:80vw; height: 100px ' : 'width:70vw'"
    >
      <USelect
        v-if="entryPageMode"
        v-model="_searchType"
        :items="types"
        placeholder="Was suchen Sie?"
        size="lg"
        variant="ghost"
        class="rounded-md w-full bg-white dark:bg-gray-700"
        :ui="{
          placeholder: hasMissingType ? 'text-red-500 font-bold' : '',
        }"
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <InputText
        v-model="_term"
        icon="i-lucide-search"
        placeholder="Stichwort"
        clearable
        class="rounded-md"
        @keyup.enter="onSearch"
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <InputText
        v-model="_location"
        icon="i-lucide-map-pin"
        placeholder="Ort"
        clearable
        class="rounded-md"
        @keyup.enter="onSearch"
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <InputTimePeriod
        v-model:time-period="_timePeriod"
        @select-date="setSearchTimePeriod"
        @remove-date="removeSearchTimePeriod"
      />
      <UButton
        label="Suchen"
        class="w-full justify-center"
        :style="{ color: contrastToPrimary }"
        @click="onSearch"
      />
    </div>
  </div>
  <!--Card for smaller screens -->
  <UCard
    class="bg-white dark:bg-gray-700 mx-5 -mt-15 p-0 shadow-lg md:hidden"
    :class="entryPageMode ? '-mt-20' : '-mt-15'"
    :ui="{ root: 'p-0', body: 'p-0' }"
    style="position: relative; width: 80vw"
  >
    <USelect
      v-model="_searchType"
      :items="types"
      icon="i-lucide-search"
      placeholder="Was suchen Sie?"
      size="lg"
      variant="ghost"
      class="rounded-md w-full bg-white dark:bg-gray-700"
      :ui="{
        placeholder: hasMissingType ? 'text-red-500 font-bold' : '',
      }"
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputText
      v-model="_term"
      icon="i-lucide-book-search"
      placeholder="Stichwort"
      clearable
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputText
      v-model="_location"
      icon="i-lucide-map-pin"
      placeholder="Ort"
      clearable
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputTimePeriod
      :time-period="_timePeriod"
      @select-date="setSearchTimePeriod"
      @remove-date="removeSearchTimePeriod"
    />
    <UButton
      label="Suchen"
      class="w-full justify-center"
      :style="{ color: contrastToPrimary }"
      @click="onSearch"
    />
  </UCard>
</template>
<script setup>
import InputText from "~/components/inputs/InputText.vue";
import InputTimePeriod from "~/components/inputs/InputTimePeriod.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const isInitialized = defineModel("isInitailized", {
  type: Boolean,
  default: false,
});

const filterResetKey = defineModel("filter-reset-key", {
  type: Number,
  default: 0,
});

const props = defineProps({
  entryPageMode: {
    type: Boolean,
    default: false,
  },
  searchType: {
    type: String,
    default: null,
  },
  term: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  timePeriod: {
    type: Object,
    default: null,
  },
  timeStart: {
    type: Number,
    default: null,
  },
  timeEnd: {
    type: Number,
    default: null,
  },
});

const _searchType = ref(props.searchType);
const _term = ref(props.term);
const _location = ref(props.location);
const _timePeriod = ref({
  start: props.timeStart,
  end: props.timeEnd,
});

const types = ref([
  {
    label: "Buchungsobjekte",
    value: "bookables",
  },
  {
    label: "Veranstaltungen",
    value: "events",
  },
]);
const hasMissingType = computed(
  () => isInitialized.value && !_searchType.value
);
const emit = defineEmits(["search", "reset"]);

const { contrastToPrimary } = useContrastColor();


function setSearchTimePeriod(tp) {
  _timePeriod.value = tp;
}

function removeSearchTimePeriod() {
  _timePeriod.value = null;
}

function onSearch() {
  if (hasMissingType.value) {
    const notification = useNotification();
    notification.success(
      "Bitte legen Sie fest, wonach Sie suchen möchten.",
      "Unklare Suchanfrage"
    );
    return;
  }
  if (_timePeriod.value) {
    if (!_timePeriod.value.end && _timePeriod.value.start) {
      _timePeriod.value.end = _timePeriod.value.start;
    }
  }

  const hasTime =
    _timePeriod.value && _timePeriod.value.start && _timePeriod.value.end;

  const hasCriteria = !!_term.value || !!_location.value || hasTime;

  if (!hasCriteria) {
    isInitialized.value = false;
    filterResetKey.value++;
    emit("reset");
    return;
  }

  isInitialized.value = true;

  emit("search", {
    searchType: _searchType.value,
    term: _term.value,
    location: _location.value,
    timeStart: _timePeriod.value ? _timePeriod.value.start : null,
    timeEnd: _timePeriod.value ? _timePeriod.value.end : null,
  });
}
</script>
<style scoped></style>

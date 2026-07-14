<template>
  <!-- Strip for md and larger screens -->
  <div class="hidden lg:block">
    <div
      class="flex justify-between bg-surface-muted z-100 rounded shadow-lg"
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
        class="basis-1/6 rounded-md w-full bg-surface-raised hover:bg-transparent"
        :ui="{
          placeholder: hasMissingType
            ? 'text-red-500 font-bold'
            : 'text-gray-400 dark:text-gray-200/60',
        }"
      />
      <USeparator
        v-if="entryPageMode"
        orientation="vertical"
        :ui="{ border: 'border-gray-300' }"
      />
      <InputText
        v-model="_term"
        icon="i-lucide-search"
        placeholder="Stichwort"
        clearable
        class="rounded-md"
        :class="entryPageMode ? 'basis-1/6' : 'basis-1/5'"
        :ui="{
          base: 'placeholder:text-gray-400 dark:text-gray-200 hover:bg-transparent',
          leadingIcon: 'text-gray-400 dark:text-gray-200',
        }"
        @keyup.enter="onSearch"
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <AddressLookup
        v-model="_location"
        :distance="_distance"
        class="basis-1/4 rounded-md"
        :class="entryPageMode ? 'basis-2/6' : 'basis-2/5'"
        :ui="{
          base: 'placeholder:text-gray-400 dark:text-gray-200 hover:bg-transparent',
          leadingIcon: 'text-gray-400 dark:text-gray-200',
        }"
        @keyup.enter="onSearch"
        @change-distance="setDistance"
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <InputDateTimePeriod
        v-model:time-period="_timePeriod"
        :class="entryPageMode ? 'basis-1/6' : 'basis-1/5'"
        @select-date="setSearchTimePeriod"
        @remove-date="removeSearchTimePeriod"
      />
      <UButton
        label="Suchen"
        class="w-full justify-center"
        :class="entryPageMode ? 'basis-1/6' : 'basis-1/5'"
        :style="{ color: contrastToPrimary }"
        @click="onSearch"
      />
    </div>
  </div>

  <!--Card for smaller screens -->
  <UCard
    class="bg-surface-raised mx-5 -mt-15 p-0 shadow-lg lg:hidden"
    :class="entryPageMode ? '-mt-20' : '-mt-10'"
    :ui="{ root: 'p-0', body: 'p-0' }"
    style="position: relative; width: 80vw"
  >
    <USelect
      v-if="entryPageMode"
      v-model="_searchType"
      :items="types"
      icon="i-lucide-search"
      placeholder="Was suchen Sie?"
      size="lg"
      variant="ghost"
      class="rounded-md w-full bg-surface-raised hover:bg-transparent"
      :ui="{
        placeholder: hasMissingType
          ? 'text-red-500 font-bold'
          : 'text-gray-400 dark:text-gray-200/60',
        leadingIcon: 'text-gray-400 dark:text-gray-200',
      }"
    />
    <USeparator
      v-if="entryPageMode"
      class="w-full"
      :ui="{ border: 'border-gray-300' }"
    />
    <InputText
      v-model="_term"
      icon="i-lucide-book-search"
      placeholder="Stichwort"
      clearable
      :ui="{
        base: 'placeholder:text-gray-400 dark:text-gray-200 hover:bg-transparent',
        leadingIcon: 'text-gray-400 dark:text-gray-200',
      }"
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <AddressLookup
      v-model="_location"
      :distance="_distance"
      class="rounded-md"
      :ui="{
        base: 'placeholder:text-gray-400 dark:text-gray-200 hover:bg-transparent',
        leadingIcon: 'text-gray-400 dark:text-gray-200',
      }"
      @change-distance="setDistance"
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputDateTimePeriod
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
import InputDateTimePeriod from "~/components/inputs/InputDateTimePeriod.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import AddressLookup from "~/components/inputs/AddressLookup.vue";

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
  distance: {
    type: Number,
    default: null,
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

const _searchType = ref(props.searchType || "bookables");
const _term = ref(props.term);
const _location = ref(props.location);
const _distance = ref(props.distance || 20);
const _timePeriod = ref({
  start: props.timeStart,
  end: props.timeEnd,
});

watch(
    () => props.distance,
    (newVal) => {
      if (newVal !== _distance.value) {
        _distance.value = newVal;
      }
    },
)

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
  () => isInitialized.value && !_searchType.value,
);
const hasSearchCiteria = computed(
  () =>
    !!_term.value ||
    !!_location.value ||
    (_timePeriod.value && _timePeriod.value.start && _timePeriod.value.end),
);
const emit = defineEmits(["search", "reset"]);

const { contrastToPrimary } = useContrastColor();

const hasInitionalLocationObject = ref(false);
watch(_location, (newVal) => {
  if (
    !props.entryPageMode &&
    !hasInitionalLocationObject.value &&
    newVal &&
    typeof newVal === "object" &&
    newVal.coordinates &&
    newVal.coordinates.points &&
    newVal.coordinates.points.length > 0
  ) {
    hasInitionalLocationObject.value = true;
    onSearch();
  }
});

function setDistance(dist) {
  _distance.value = dist;
}

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
      "Unklare Suchanfrage",
    );
    return;
  }
  if (_timePeriod.value) {
    if (!_timePeriod.value.end && _timePeriod.value.start) {
      _timePeriod.value.end = _timePeriod.value.start;
    }
  }

  if (!hasSearchCiteria.value) {
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
    distance:
      typeof _location.value === "object" && _location.value.coordinates
        ? _distance.value
        : null,
    timeStart: _timePeriod.value ? _timePeriod.value.start : null,
    timeEnd: _timePeriod.value ? _timePeriod.value.end : null,
  });
}
</script>
<style scoped></style>

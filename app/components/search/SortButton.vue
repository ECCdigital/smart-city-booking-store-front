<template>
  <UDropdownMenu
    :items="sortOptions"
    :ui="{
      content: 'w-48',
    }"
  >
    <UButton
      :label="'Sortieren: ' + displaySortMode()"
      icon="i-lucide-arrow-up-down"
      color="neutral"
      variant="soft"
      class="rounded-full py-2 px-3"
    />
  </UDropdownMenu>
</template>
<script setup>
const emit = defineEmits(["sort"]);

const props = defineProps({
  isEvent: {
    type: Boolean,
    default: false,
  },
  sortMode: {
    type: String,
    default: "relevance",
  },
});

const _sortMode = ref(props.sortMode);
const sortOptions = ref([
  {
    value: "relevance",
    label: "Relevanz",
    icon: "i-lucide-search-check",
    class: computed(() =>
      _sortMode.value === "relevance" ? "bg-primary/10" : ""
    ),
    onSelect() {
      _sortMode.value = "relevance";
      onSort();
    },
  },
  {
    value: "priceAscending",
    label: "Preis (aufsteigend)",
    icon: "i-lucide-arrow-up",
    class: computed(() =>
        _sortMode.value === "priceAscending" ? "bg-primary/10" : ""
    ),
    onSelect() {
      _sortMode.value = "priceAscending";
      onSort();
    },
  },
  {
    value: "priceDescending",
    label: "Preis (absteigend)",
    icon: "i-lucide-arrow-down",
    class: computed(() =>
        _sortMode.value === "priceDescending" ? "bg-primary/10" : ""
    ),
    onSelect() {
      _sortMode.value = "priceDescending";
      onSort();
    },
  },
  /*{
    value: "distanceAscending",
    label: "Distanz (aufsteigend)",
    icon: "i-lucide-arrow-up",
    class: computed(() =>
      _sortMode.value === "distanceAscending" ? "bg-primary/10" : "",
    ),
    onSelect() {
      _sortMode.value = "distanceAscending";
      onSort();
    },
  },
  {
    value: "distanceDescending",
    label: "Distanz (absteigend)",
    icon: "i-lucide-arrow-down",
    class: computed(() =>
      _sortMode.value === "distanceDescending" ? "bg-primary/10" : "",
    ),
    onSelect() {
      _sortMode.value = "distanceDescending";
      onSort();
    },
  },*/
]);

function displaySortMode() {
  return sortOptions.value.find((option) => option.value === _sortMode.value)
    .label;
}

function onSort() {
  emit("sort", _sortMode.value);
}
</script>

<style scoped></style>

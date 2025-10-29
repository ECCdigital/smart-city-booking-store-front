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
  sortMode: {
    type: String,
    required: true,
  },
});

const sortOptions = ref([
  {
    value: "relevance",
    label: "Relevanz",
    icon: "i-lucide-search-check",
    class: computed(() => props.sortMode === "relevance" ? "bg-primary/10" : ""),
    onSelect() {
      emit("sort", "relevance");
    },
  },
  {
    value: "priceAscending",
    label: "Preis (aufsteigend)",
    icon: "i-lucide-arrow-up",
    class: computed(() => props.sortMode === "priceAscending" ? "bg-primary/10" : ""),
    onSelect() {
      emit("sort", "priceAscending");
    },
  },
  {
    value: "priceDescending",
    label: "Preis (absteigend)",
    icon: "i-lucide-arrow-down",
    class: computed(() => props.sortMode === "priceDescending" ? "bg-primary/10" : ""),
    onSelect() {
      emit("sort", "priceDescending");
    },
  },
  {
    value: "distanceAscending",
    label: "Distanz (aufsteigend)",
    icon: "i-lucide-arrow-up",
    class: computed(() => props.sortMode === "distanceAscending" ? "bg-primary/10" : ""),
    onSelect() {
      emit("sort", "distanceAscending");
    },
  },
  {
    value: "distanceDescending",
    label: "Distanz (absteigend)",
    icon: "i-lucide-arrow-down",
    class: computed(() => props.sortMode === "distanceDescending" ? "bg-primary/10" : ""),
    onSelect() {
      emit("sort", "distanceDescending");
    },
  },
]);

function displaySortMode() {
  return sortOptions.value.find((option) => option.value === props.sortMode)
    .label;
}
</script>

<style scoped></style>

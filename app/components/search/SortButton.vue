<template>
  <UDropdownMenu
    :items="sortOptions"
    :ui="{
      content: 'w-48',
    }"
  >
    <UButton
      label="Sortieren"
      icon="i-lucide-arrow-up-down"
      color="neutral"
      variant="soft"
      class="rounded-full py-2 px-3"
    />
  </UDropdownMenu>
</template>
<script setup>
const emit = defineEmits(["sort"]);

const sortOptions = ref([
  {
    label: "Relevanz",
    icon: "i-lucide-search-check",
    onSelect() {
      console.log("sortieren nach Relevanz");
      emit("sort", "relevance");
    },
  },
  {
    label: "Preis (aufsteigend)",
    icon: "i-lucide-arrow-up",
    onSelect() {
      console.log("sortieren nach Preis (aufsteigend)");
      emit("sort", "priceAscending");
    },
  },
  {
    label: "Preis (absteigend)",
    icon: "i-lucide-arrow-down",
    onSelect() {
      console.log("sortieren nach Preis (absteigend)");
      emit("sort", "priceDescending");
    },
  },
  {
    label: "Distanz (aufsteigend)",
    icon: "i-lucide-arrow-up",
    onSelect() {
      console.log("sortieren nach Distanz (aufsteigend)");
      emit("sort", "distanceAscending");
    },
  },
  {
    label: "Distanz (absteigend)",
    icon: "i-lucide-arrow-down",
    onSelect() {
      console.log("sortieren nach Distanz (absteigend)");
      emit("sort", "distanceDescending");
    },
  },
]);

function onSort() {
  emit("sort");
}
</script>

<style scoped></style>

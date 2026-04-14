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
    default: "alphabeticAscending",
  },
});

const route = useRoute();
const hasLocationParam = computed(() => !!route.query.loc);

const _sortMode = ref(props.sortMode);
const sortOptions = computed(() => {
  const options = [];

  if (hasLocationParam.value) {
    options.push(
      {
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
      },
    );
  }
  options.push(
    {
      value: "alphabeticAscending",
      label: "Alphabetisch (aufsteigend)",
      icon: "arrow-down-a-z",
      class: computed(() =>
        _sortMode.value === "alphabeticAscending" ? "bg-primary/10" : "",
      ),
      onSelect() {
        _sortMode.value = "alphabeticAscending";
        onSort();
      },
    },
    {
      value: "alphabeticDescending",
      label: "Alphabetisch (absteigend)",
      icon: "arrow-up-a-z",
      class: computed(() =>
        _sortMode.value === "alphabeticDescending" ? "bg-primary/10" : "",
      ),
      onSelect() {
        _sortMode.value = "alphabeticDescending";
        onSort();
      },
    },
    {
      value: "priceAscending",
      label: "Preis (aufsteigend)",
      icon: "i-lucide-arrow-up",
      class: computed(() =>
        _sortMode.value === "priceAscending" ? "bg-primary/10" : "",
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
        _sortMode.value === "priceDescending" ? "bg-primary/10" : "",
      ),
      onSelect() {
        _sortMode.value = "priceDescending";
        onSort();
      },
    },
  );
  return options;
});

function displaySortMode() {
  console.log("Current sort mode:", _sortMode.value);
  return sortOptions.value.find((option) => option.value === _sortMode.value)
    .label;
}

function onSort() {
  emit("sort", _sortMode.value);
}
</script>

<style scoped></style>

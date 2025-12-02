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
  itemsToSort: {
    type: Array,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const sortMode = ref("relevance");
const sortOptions = ref([
  {
    value: "relevance",
    label: "Relevanz",
    icon: "i-lucide-search-check",
    class: computed(() =>
      sortMode.value === "relevance" ? "bg-primary/10" : "",
    ),
    onSelect() {
      sortMode.value = "relevance";
      onSort();
    },
  },
  {
    value: "priceAscending",
    label: "Preis (aufsteigend)",
    icon: "i-lucide-arrow-up",
    class: computed(() =>
      sortMode.value === "priceAscending" ? "bg-primary/10" : "",
    ),
    onSelect() {
      sortMode.value = "priceAscending";
      onSort();
    },
  },
  {
    value: "priceDescending",
    label: "Preis (absteigend)",
    icon: "i-lucide-arrow-down",
    class: computed(() =>
      sortMode.value === "priceDescending" ? "bg-primary/10" : "",
    ),
    onSelect() {
      sortMode.value = "priceDescending";
      onSort();
    },
  },
  /*{
    value: "distanceAscending",
    label: "Distanz (aufsteigend)",
    icon: "i-lucide-arrow-up",
    class: computed(() =>
      sortMode.value === "distanceAscending" ? "bg-primary/10" : "",
    ),
    onSelect() {
      sortMode.value = "distanceAscending";
      onSort();
    },
  },
  {
    value: "distanceDescending",
    label: "Distanz (absteigend)",
    icon: "i-lucide-arrow-down",
    class: computed(() =>
      sortMode.value === "distanceDescending" ? "bg-primary/10" : "",
    ),
    onSelect() {
      sortMode.value = "distanceDescending";
      onSort();
    },
  },*/
]);

watch([sortMode, () => props.itemsToSort], onSort, { deep: true });


function displaySortMode() {
  return sortOptions.value.find((option) => option.value === sortMode.value)
    .label;
}

//Preis
function getPrice(item) {
  if (props.isEvent) {
    if (item.item.tickets && item.item.tickets.length > 0) {
      return Math.min(
        ...item.item.tickets.map((ticket) => {
          const minPrice = Math.min(
            ...ticket.priceCategories.map((cat) => cat.priceEur)
          );
          const temp =  ticket.priceValueAddedTax
            ? minPrice + (minPrice * ticket.priceValueAddedTax) / 100
            : minPrice;
          return temp;
        })
      );
    } else {
      return 0; // Kein Ticket verfügbar
    }
  } else {
    if (item.calculatedPrice) {
      return item.calculatedPrice.userGrossPriceEur;
    }
    const minPrice = Math.min(
      ...(item.item?.priceCategories?.map((cat) => cat.priceEur) || []),
    );
    return item.item.priceValueAddedTax
      ? minPrice + (minPrice * item.item.priceValueAddedTax) / 100
      : minPrice;
  }
}

function onSort() {
  let sortedItems = [...props.itemsToSort];
  console.log(sortedItems)
  //toDo - Sortierung nach Beliebtheit ergänzen?!

  //Default: momentan "Relevanz" nach Fuze-Suche...

  sortedItems = sortedItems.sort((a, b) => {
    //Sortieren nach Preis
    if (sortMode.value === "priceAscending") {
      return getPrice(a) - getPrice(b);
    }
    if (sortMode.value === "priceDescending") {
      return getPrice(b) - getPrice(a);
    }

    //toDo - Sortierung nach Distanz ergänzen!!
    // Momentan keine Entfernung vorhanden, also keine Sortierung
    /*
      if (mode === "distanceAscending") {
        return a.calculatedDistance - b.calculatedDistance;
      }
      if (mode === "distanceDescending") {
        return b.calculatedDistance - a.calculatedDistance;
      } else {

      }
      */
    return 0;
  });

  emit("sort", sortedItems);
}
</script>

<style scoped></style>

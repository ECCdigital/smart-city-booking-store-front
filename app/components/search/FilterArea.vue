<template>
  <div :class="useAsDialog ? '' : 'my-2 p-2 border border-gray-200 rounded'">
    <p class="my-4 font-bold">Ergebnisse filtern</p>
    <USeparator v-if="!useAsDialog" class="border-gray-200" />
    <div class="my-4 space-y-3">
      <div class="flex space-x-2">
        <USwitch
          v-model="includeNonSuitable"
          label="Nicht passende Objekte anzeigen."
          @change="instantFilter"
        />
      </div>
      <div class="flex space-x-2">
        <USwitch
          v-model="includeNonBookable"
          label="Nicht buchbare Objekte anzeigen."
          @change="instantFilter"
        />
      </div>
      <!-- Kategorie -->
      <div class="my-7">
        <p class="mb-3">Kategorie</p>
        <UCheckboxGroup
          v-model="choosenCategories"
          :items="categories"
          :ui="{ label: 'text-base' }"
          @change="instantFilter"
        />
      </div>
      <!-- Preis -->
      <div class="my-7">
        <p class="mb-3">Preis</p>
        <p class="mb-3">
          € {{ choosenPriceRange[0] }} - € {{ choosenPriceRange[1] }}
        </p>
        <div
          v-if="priceBins.some((p) => p > 0)"
          class="flex space-x-1 h-15 items-end justify-between"
        >
          <div
            v-for="(count, index) in priceBins"
            :key="index"
            :style="{ height: count * 10 + 'px' }"
            class="bg-primary/40 w-6"
          />
        </div>
        <USlider
          v-model="choosenPriceRange"
          :min="priceRange[0]"
          :max="priceRange[1]"
          :step="5"
          @change="instantFilter"
        />
      </div>
      <!-- Distanz -->
      <div class="my-7">
        <p class="mb-3">Distanz</p>
        <p class="mb-3">
          {{ choosenDistanceRange[0] }} km - {{ choosenDistanceRange[1] }} km
        </p>
        <USlider
          v-model="choosenDistanceRange"
          :min="distanceRange[0]"
          :max="distanceRange[1]"
          :step="10"
          @change="instantFilter"
        />
      </div>
    </div>
    <div v-if="useAsDialog" class="flex justify-end">
      <UButton
        label="Filtern"
        icon="i-lucide-funnel"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="onFilter"
      />
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  useAsDialog: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["filter"]);

//Passende und buchbare Objekte
const includeNonSuitable = ref(true);
const includeNonBookable = ref(true);

//Kategorien - toDo - anpassen!!!!!!!!!!!!!!!!!!!!
const choosenCategories = ref([]);
const categories = [
  { label: "Seminarräume", value: "kategorie1" },
  { label: "Konferenzräume", value: "kategorie2" },
  { label: "Werkstätten", value: "kategorie3" },
];

//Preis
const priceRange = computed(() => {
  const validPrices = props.bookables
    .map((b) => b.calculatedPrice?.userGrossPriceEur)
    .filter((price) => price !== undefined && price !== null);

  const minPrice =
    validPrices.length > 0 ? Math.floor(Math.min(...validPrices)) : 0;
  const maxPrice =
    validPrices.length > 0 ? Math.ceil(Math.max(...validPrices)) : 100;
  return [minPrice, maxPrice];
});
const choosenPriceRange = ref([priceRange.value[0], priceRange.value[1]]);
const priceBins = computed(() => {
  const binsCount =
    Math.ceil((priceRange.value[1] - priceRange.value[0]) / 5) || 1;
  console.log("binsCount: ", binsCount);
  const bins = new Array(binsCount).fill(0);
  console.log("bins before: ", bins);
  const range = priceRange.value[1] - priceRange.value[0];
  console.log("range: ", range);
  props.bookables.forEach((b) => {
    if (b.calculatedPrice) {
      const index = Math.min(
        Math.floor(
          ((b.calculatedPrice.userGrossPriceEur - priceRange.value[0]) /
            range) *
            binsCount,
        ),
        binsCount - 1,
      );
      bins[index]++;
    }
  });
  return bins;
});

//Distanz
const distanceRange = ref([0, 100]); //in km //toDo - implementieren!!!!!!!!!
const choosenDistanceRange = ref([
  distanceRange.value[0],
  distanceRange.value[1],
]);

function instantFilter() {
  if (!props.useAsDialog) {
    onFilter();
  }
}

function onFilter() {
  if (props.bookables.length > 0) {
    let filteredBookables = props.bookables;

    //Passende und buchbare Objekte
    if (!includeNonSuitable.value) {
      console.log("only want suitable locations");
      filteredBookables = filteredBookables.filter(
        (b) => b.status !== "nonSuitable",
      );
    }
    if (!includeNonBookable.value) {
      console.log("only want bookable locations");
      filteredBookables = filteredBookables.filter(
        (b) => b.status !== "nonBookable",
      );
    }

    filteredBookables = filteredBookables.filter((b) => {
      if (b.calculatedPrice) {
        const price = b.calculatedPrice?.userGrossPriceEur || 0;

        return (
          price >= choosenPriceRange.value[0] &&
          price <= choosenPriceRange.value[1]
        );
      }
      return true;
    });

    //toDo - Filterlogik für Kategorie ergänzen!!!!!!!!!!!!!!!!!
    //toDo - Filterlogik für Distanz ergänzen!!!!!!!!!!!!!!!!!

    emit("filter", filteredBookables);
  }
}
</script>
<style scoped></style>

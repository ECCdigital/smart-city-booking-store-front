<template>
  <div :class="useAsDialog ? '' : 'my-2 p-2 border border-gray-200 rounded'">
    <div class="flex justify-between items-center">
      <p class="my-4 font-bold">Ergebnisse filtern</p>
      <UTooltip v-if="!useAsDialog" text="Filter zurücksetzen">
        <UButton
          v-if="!useAsDialog && filterIsActive"
          icon="i-lucide-trash"
          variant="ghost"
          class="rounded-full py-2 px-3"
          :class="filterIsActive ? '' : ''"
          :style="
            colorMode === 'dark'
              ? { color: lighterColor }
              : { color: darkerColor }
          "
          @click="removeFilter"
        />
      </UTooltip>
    </div>
    <USeparator v-if="!useAsDialog" class="border-gray-200" />
    <div class="my-4 space-y-3">
      <div class=" space-y-3">
        <USwitch
          v-model="includeNonSuitable"
          label="Nicht passende Objekte anzeigen."
          :style="
            colorMode === 'dark'
              ? '--ui-primary: ' + lighterColor
              : '--ui-primary: ' + darkerColor
          "
          @change="instantFilter"
        />
        <USwitch
            v-if="isEvent"
            v-model="onlyPublicEvents"
            label="Nur öffentliche Events anzeigen."
            :style="
            colorMode === 'dark'
              ? '--ui-primary: ' + lighterColor
              : '--ui-primary: ' + darkerColor
          "
            @change="instantFilter"
        />
        <USwitch
            v-if="isEvent"
            v-model="onlyRegistrationNeededEvents"
            label="Nur anmeldepflichte Events anzeigen."
            :style="
            colorMode === 'dark'
              ? '--ui-primary: ' + lighterColor
              : '--ui-primary: ' + darkerColor
          "
            @change="instantFilter"
        />
      </div>
    </div>
    <!-- Kategorie -->
    <div class="my-7">
      <p class="mb-3">Kategorie</p>
      <UCheckboxGroup
        v-model="choosenCategories"
        :items="categories"
        :ui="{ label: 'text-base' }"
        :style="
          colorMode === 'dark'
            ? '--ui-primary: ' + lighterColor
            : '--ui-primary: ' + darkerColor
        "
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
        v-if="priceBars.some((p) => p > 0)"
        class="flex space-x-1 items-end justify-between max-w-sm"
      >
        <div
          v-for="(count, index) in priceBars"
          :key="index"
          class="w-full"
          style="max-height: 50px"
          :style="{
            height: (count / Math.max(...priceBars)) * 50 + 'px',
            backgroundColor: colorMode === 'dark' ? lighterColor : darkerColor,
            opacity: 0.4,
          }"
        />
      </div>

      <USlider
        v-model="choosenPriceRange"
        :min="priceRange[0]"
        :max="priceRange[1]"
        :step="dynamicPriceStep"
        :style="
          colorMode === 'dark'
            ? '--ui-primary: ' + lighterColor
            : '--ui-primary: ' + darkerColor
        "
        @change="instantFilter"
      />
    </div>
    <!-- Distanz -->
    <div v-if="searchIsInitialized" class="my-7">
      <p class="mb-3">Distanz</p>
      <p class="mb-3">
        {{ choosenDistanceRange[0] }} km - {{ choosenDistanceRange[1] }} km
      </p>
      <USlider
        v-model="choosenDistanceRange"
        :min="distanceRange[0]"
        :max="distanceRange[1]"
        :step="10"
        :style="
          colorMode === 'dark'
            ? '--ui-primary: ' + lighterColor
            : '--ui-primary: ' + darkerColor
        "
        @change="instantFilter"
      />
    </div>

    <div v-if="useAsDialog" class="flex justify-between">
      <UButton
        v-if="filterIsActive"
        label="Filter entfernen"
        icon="i-lucide-trash"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="removeFilter"
      />
      <div v-else class="flex-1" />
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
import { useColorMode } from "@vueuse/core";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const searchIsInitialized = defineModel("isInitailized", { type: Boolean });
const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  useAsDialog: {
    type: Boolean,
    default: false,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["filter"]);

const filterIsActive = ref(false);

//Colors
const colorMode = useColorMode();
const darkerColor = computed(() => useContrastColor().darkerColor());
const lighterColor = computed(() => useContrastColor().lighterColor());

//Passende Objekte
const includeNonSuitable = ref(true);
const onlyPublicEvents = ref(false);
const onlyRegistrationNeededEvents = ref(false);

//Kategorien - toDo - anpassen und dynamisch auslesen!!!!!!!!!!!!!!!!!!!!
const choosenCategories = ref([]);
const categories = computed(() => {
  let type = "";
  if(props.isEvent){
    type ="event";
  } else if (props.bookables.length > 0) {
    type = props.bookables[0].item.type;
  }
switch (type){
    case "event":
      return eventCategories;
    case "resource":
      return resourceCategories;
    case "event-location":
      return locationCategories;
      case "room":
        return locationCategories;
  }
  return null;
});
const locationCategories = [
  { label: "Seminarräume", value: "kategorie1" },
  { label: "Konferenzräume", value: "kategorie2" },
  { label: "Werkstätten", value: "kategorie3" },
];
const resourceCategories = [
  { label: "Mobilität", value: "kategorie4" },
  { label: "Elektorgeräte", value: "kategorie5" },
  { label: "Gerätestationen", value: "kategorie6" },
];
const eventCategories = [
  { label: "Konzerte", value: "kategorie7" },
  { label: "Workshops", value: "kategorie8" },
  { label: "Vorträge", value: "kategorie9" },
];

//Preis
const priceRange = computed(() => {
  let validPrices = [];
  if (!props.isEvent) {
    validPrices = props.bookables.map((b) => getBookableMinPrice(b));
  } else {
    validPrices = props.bookables.map((e) => getEventMinPrice(e));
  }
  validPrices = validPrices.filter(
    (price) => price !== undefined && price !== null && !isNaN(price),
  );

  //set endpoints rounded to 5
  const minPrice =
    validPrices.length > 0 ? Math.floor(Math.min(...validPrices) / 5) * 5 : 0;
  const maxPrice =
    validPrices.length > 0 ? Math.ceil(Math.max(...validPrices) / 5) * 5 : 100;
  return [minPrice, maxPrice];
});

const choosenPriceRange = ref([priceRange.value[0], priceRange.value[1]]);
const dynamicPriceStep = computed(() => {
  const range = priceRange.value[1] - priceRange.value[0];

  let step = Math.ceil(range / 20); // 20 steps max
  step = Math.max(5, Math.ceil(step / 5) * 5);
  return step;
});
const priceBars = computed(() => {
  //set number of bars depending on price range
  const barsCount =
    Math.ceil(
      (priceRange.value[1] - priceRange.value[0]) / dynamicPriceStep.value,
    ) || 1;
  const  bars = new Array(barsCount).fill(0);
  const range = priceRange.value[1] - priceRange.value[0];

  props.bookables.forEach((b) => {
    let minPrice = null;
    if (!props.isEvent) {
      minPrice = getBookableMinPrice(b);
    } else {
      minPrice = getEventMinPrice(b);
    }
    //sort price into bars
    if (minPrice !== null) {
      const index = Math.min(
        Math.floor(((minPrice - priceRange.value[0]) / range) * barsCount),
        barsCount - 1,
      );
      bars[index]++;
    }
  });
  return bars;
});

function getBookableMinPrice(bookable) {
  if (bookable.status !== "suitable") {
    return null;
  }
  //if search is initialized, return calculated price
  if (searchIsInitialized.value && bookable.calculatedPrice) {
    return bookable.calculatedPrice.userGrossPriceEur;
  }
  //else return min price from price categories
  const minPrice = Math.min(
    ...(bookable.item?.priceCategories?.map((cat) => cat.priceEur) || []),
  );
  return bookable.item.priceValueAddedTax
    ? minPrice + (minPrice * bookable.item.priceValueAddedTax) / 100
    : minPrice;
}
function getTicketMinPrice(ticket) {
  const minPrice = Math.min(
    ...ticket.priceCategories.map((cat) => cat.priceEur),
  );
  return ticket.priceValueAddedTax
    ? minPrice + (minPrice * ticket.priceValueAddedTax) / 100
    : minPrice;
}
function getEventMinPrice(event) {
  if (event.status !== "suitable") {
    return null;
  }
  if (event.item.tickets && event.item.tickets.length > 0) {
    return Math.min(
      ...event.item.tickets.map((ticket) => getTicketMinPrice(ticket)),
    );
  } else {
    return 0;
  }
}

//Distanz
const distanceRange = ref([0, 100]); //in km //toDo - implementieren!!!!!!!!!
const choosenDistanceRange = ref([
  distanceRange.value[0],
  distanceRange.value[1],
]);

function instantFilter() {
  filterIsActive.value = true;
  if (!props.useAsDialog) {
    onFilter();
  }
}

function onFilter() {
  if (props.bookables.length > 0) {
    let filteredBookables = props.bookables;

    if (!includeNonSuitable.value) {
      filteredBookables = filteredBookables.filter(
        (b) => b.status !== "nonSuitable",
      );
    }
    //filter by event properties
    if(props.isEvent && onlyPublicEvents.value){
      filteredBookables = filteredBookables.filter(
          (e) => e.item.attendees.publicEvent === true,
      );
    }
    if(props.isEvent && onlyRegistrationNeededEvents.value){
      filteredBookables = filteredBookables.filter(
          (e) => e.item.attendees.needsRegistration === true,
      );
    }

    //filter by price
    filteredBookables = filteredBookables.filter((b) => {
      let price = 0;
      if (!props.isEvent) {
        price = getBookableMinPrice(b) || 0;
      } else {
        price = getEventMinPrice(b) || 0;
      }

      return (
        price >= choosenPriceRange.value[0] &&
        price <= choosenPriceRange.value[1]
      );
    });

    //toDo - Filterlogik für Kategorie ergänzen!!!!!!!!!!!!!!!!!
    //toDo - Filterlogik für Distanz ergänzen!!!!!!!!!!!!!!!!!

    emit("filter", filteredBookables);
  }
}
function removeFilter() {
  includeNonSuitable.value = true;
  choosenCategories.value = [];
  choosenPriceRange.value = [priceRange.value[0], priceRange.value[1]];
  choosenDistanceRange.value = [distanceRange.value[0], distanceRange.value[1]];

  filterIsActive.value = false;
  emit("filter", props.bookables);
}
</script>
<style scoped></style>

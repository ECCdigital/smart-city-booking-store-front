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
      <div class="space-y-3">
        <USwitch
          v-model="_includeNonSuitable"
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
          v-model="_onlyPublicEvents"
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
          v-model="_onlyRegistrationNeededEvents"
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
    <!-- Orte -->
    <div v-if="possibleCities.length" class="my-7">
      <p class="mb-3">Orte</p>
      <UCheckboxGroup
        v-model="_cities"
        :items="possibleCities.slice(0, numberOfVisibleCities)"
        :ui="{ label: 'text-base' }"
        :style="
          colorMode === 'dark'
            ? '--ui-primary: ' + lighterColor
            : '--ui-primary: ' + darkerColor
        "
        @change="instantFilter"
      >
        <template #label="{ item }">
          <div class="flex">
            {{ item.value }}
            <span class="text-gray-500 ml-2 text-sm content-center"
              >({{ item.count }})</span
            >
          </div>
        </template>
      </UCheckboxGroup>
      <div class="flex justify-center w-full mt-2">
        <UButton
          v-if="numberOfVisibleCities < possibleCities.length"
          label="Alle Städe anzeigen"
          variant="ghost"
          @click="
            () => {
              numberOfVisibleCities = possibleCities.length;
            }
          "
        />
        <UButton
          v-if="numberOfVisibleCities === possibleCities.length"
          label="Weniger Städe anzeigen"
          variant="ghost"
          @click="
            () => {
              numberOfVisibleCities = 3;
            }
          "
        />
      </div>
    </div>

    <!-- Kategorie -->
    <!--<div class="my-7">
      <p class="mb-3">Kategorie</p>
      <UCheckboxGroup
        v-model="_categories"
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
    -->
    <!-- Preis -->
    <div class="my-7">
      <p class="mb-3">Preis</p>
      <p class="mb-3">€ {{ _price[0] }} - € {{ _price[1] }}</p>
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
        v-model="_price"
        :min="possiblePriceRange[0]"
        :max="possiblePriceRange[1]"
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
    <!--
    <div v-if="searchIsInitialized" class="my-7">
      <p class="mb-3">Distanz</p>
      <p class="mb-3">
        {{ _distanceRange[0] }} km - {{ _distanceRange[1] }} km
      </p>
      <USlider
        v-model="_distanceRange"
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
    -->

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
  includeNonSuitable: {
    type: Boolean,
    default: true,
  },
  cities: {
    type: Array,
    default: () => [],
  },
  price: {
    type: Array,
    default: () => [],
  },
  onlyPublicEvents: {
    type: Boolean,
    default: true,
  },
  onlyRegistrationNeededEvents: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(["filter"]);

//Filter Variables
const filterIsActive = ref(false);
const _includeNonSuitable = ref(props.includeNonSuitable);
const _cities = ref(props.cities);
const _onlyPublicEvents = ref(props.onlyPublicEvents);
const _onlyRegistrationNeededEvents = ref(props.onlyRegistrationNeededEvents);
const _categories = ref(props.categories);

//Colors
const colorMode = useColorMode();
const darkerColor = computed(() => useContrastColor().darkerColor());
const lighterColor = computed(() => useContrastColor().lighterColor());

//Preis
const possiblePriceRange = computed(() => {
  let validPrices = [];
  if (!props.isEvent) {
    validPrices = props.bookables.map((b) => getBookableMinPrice(b));
  } else {
    validPrices = props.bookables.map((e) => getEventMinPrice(e));
  }
  validPrices = validPrices.filter(
    (price) => price !== undefined && price !== null && !isNaN(price)
  );

  //set endpoints rounded to 5
  const minPrice =
    validPrices.length > 0 ? Math.floor(Math.min(...validPrices) / 5) * 5 : 0;
  const maxPrice =
    validPrices.length > 0 ? Math.ceil(Math.max(...validPrices) / 5) * 5 : 100;
  return [minPrice, maxPrice];
});
const _price = ref(
  props.price?.length === 2 ? props.price : possiblePriceRange.value
);

const dynamicPriceStep = computed(() => {
  const range = possiblePriceRange.value[1] - possiblePriceRange.value[0];

  let step = Math.ceil(range / 20); // 20 steps max
  step = Math.max(5, Math.ceil(step / 5) * 5);
  return step;
});
const priceBars = computed(() => {
  //set number of bars depending on price range
  const barsCount =
    Math.ceil(
      (possiblePriceRange.value[1] - possiblePriceRange.value[0]) /
        dynamicPriceStep.value
    ) || 1;
  const bars = new Array(barsCount).fill(0);
  const range = possiblePriceRange.value[1] - possiblePriceRange.value[0];

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
        Math.floor(
          ((minPrice - possiblePriceRange.value[0]) / range) * barsCount
        ),
        barsCount - 1
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
    ...(bookable.item?.priceCategories?.map((cat) => cat.priceEur) || [])
  );
  return bookable.item.priceValueAddedTax
    ? minPrice + (minPrice * bookable.item.priceValueAddedTax) / 100
    : minPrice;
}
function getTicketMinPrice(ticket) {
  const minPrice = Math.min(
    ...ticket.priceCategories.map((cat) => cat.priceEur)
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
      ...event.item.tickets.map((ticket) => getTicketMinPrice(ticket))
    );
  } else {
    return 0;
  }
}

//Orte
const possibleCities = computed(() => {
  const cityCount = {};
  props.bookables.forEach((b) => {
    let city = "";
    if (props.isEvent && b.status === "suitable") {
      city = extractCity(b.item.eventAddress.city);
    } else if (b.status === "suitable") {
      city = extractCity(b.item.location);
    }
    if (city) {
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
  });
  return Object.entries(cityCount)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
});

const numberOfVisibleCities = ref(5); //toDo - später auf 10 setzen!!!!!!!!! ***
function extractCity(location) {
  if (!location || typeof location !== "string") return "";

  const trimmed = location.trim();

  //1.) if no digits are present -> probably just the city (split and take last part)
  if (!/\d/.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    return parts[parts.length - 1];
  }

  //2.) Split by commas anc check for "PLZ Ort" pattern
  const commaParts = trimmed
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of commaParts) {
    const match = part.match(/(\d{4,5})\s+(.+)/);
    if (match) {
      return match[2].trim();
    }
  }

  //3.) if nothing found, use last part and keep only words with letters
  const last = commaParts[commaParts.length - 1] || trimmed;
  const words = last.split(/\s+/).filter((w) => /[A-Za-zÄÖÜäöüß]/.test(w));
  return words.join(" ");
}

//Distanz
const distanceRange = ref([0, 100]); //in km //toDo - implementieren!!!!!!!!!
const _distanceRange = ref([distanceRange.value[0], distanceRange.value[1]]);

function instantFilter() {
  filterIsActive.value = true;
  if (!props.useAsDialog) {
    onFilter();
  }
}
function onFilter() {
  const filter = {};

  if (!Array.isArray(_price.value) || _price.value.length !== 2) {
    _price.value = possiblePriceRange.value.slice();
  }

  const sameAsPossible =
    _price.value?.length === 2 &&
    _price.value[0] === possiblePriceRange.value[0] &&
    _price.value[1] === possiblePriceRange.value[1];

  filter.inclNoSuitable = _includeNonSuitable.value;
  filter.pubEv = _onlyPublicEvents.value;
  filter.regEv = _onlyRegistrationNeededEvents.value;
  filter.cities = _cities.value;
  filter.price = sameAsPossible ? [] : _price.value;

  emit("filter", filter);
}

function removeFilter() {
  _includeNonSuitable.value = true;
  _onlyPublicEvents.value = false;
  _onlyRegistrationNeededEvents.value = false;
  _cities.value = [];
  _categories.value = [];
  _price.value = possiblePriceRange.value.slice();
  _distanceRange.value = [distanceRange.value[0], distanceRange.value[1]];

  const filter = {};

  filter.inclNoSuitable = _includeNonSuitable.value;
  filter.pubEv = _onlyPublicEvents.value;
  filter.regEv = _onlyRegistrationNeededEvents.value;
  filter.cities = _cities.value;

  const sameAsPossible =
    _price.value?.length === 2 &&
    _price.value[0] === possiblePriceRange.value[0] &&
    _price.value[1] === possiblePriceRange.value[1];

  filter.price = sameAsPossible ? [] : _price.value;

  emit("filter", filter);
}
</script>
<style scoped></style>

<template>
  <div
    :class="
      useAsDialog
        ? 'overflow-auto max-h-[80vh]'
        : 'my-2 p-2 border border-gray-200 rounded'
    "
  >
    <div class="flex justify-between items-center">
      <p class="my-4 font-bold">Ergebnisse filtern</p>
      <UTooltip v-if="!useAsDialog" text="Filter zurücksetzen">
        <UButton
          v-if="!useAsDialog && isFilterActive"
          icon="i-lucide-trash"
          variant="ghost"
          class="rounded-full py-2 px-3"
          :class="isFilterActive ? '' : ''"
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
          @change="instantFilter"
        />
        <USwitch
          v-if="isEvent"
          v-model="_onlyPublicEvents"
          label="Nur öffentliche Events anzeigen."
          @change="instantFilter"
        />
        <USwitch
          v-if="isEvent"
          v-model="_onlyRegistrationNeededEvents"
          label="Nur anmeldepflichte Events anzeigen."
          @change="instantFilter"
        />
      </div>
    </div>

    <!-- Kategorie -->
    <div v-if="!isEvent" class="my-7">
      <p class="mb-3">Kategorie</p>
      <FilterCheckboxGroup
        v-model="_categories"
        :items="possibleCategories"
        @change="instantFilter"
      />
    </div>

    <!-- Orte -->
    <div v-if="possibleCities && possibleCities.length" class="my-7">
      <p class="mb-3">Orte</p>
      <FilterCheckboxGroup
        v-model="_cities"
        :items="possibleCities"
        use-more-button
        @change="instantFilter"
      />
    </div>

    <!-- Distanz -->
    <div v-if="distance != null" class="my-7">
      <p class="mb-3">Distanz</p>
      <p class="mb-3">0 km - {{ _distance }} km</p>
      <FilterHistogramSlider
        v-model="_distance"
        mode="single"
        :min="0"
        :max="distanceRange[1]"
        :step="dynamicDistanceStep"
        :values="distanceValues"
        @change="instantFilter"
      />
    </div>

    <!-- Price-->
    <div class="my-7">
      <p class="mb-3">Preis</p>
      <p class="mb-3">€ {{ _price[0] }} - € {{ _price[1] }}</p>

      <FilterHistogramSlider
        v-model="_price"
        mode="range"
        :min="dynamicMinPrice"
        :max="dynamicMaxPrice"
        :step="dynamicPriceStep"
        :values="priceValues"
        @change="instantFilter"
      />
    </div>

    <!-- Custom Field Filter -->
    <div v-if="sortedCustomFieldFilters.length > 0" class="my-7">
      <p class="mb-3">Weitere Filter</p>
      <div class="space-y-4">
        <CustomFieldFilter
          v-for="cf in sortedCustomFieldFilters"
          :key="cf.definition.id"
          v-model="_customFieldValues[cf.definition.id]"
          :definition="cf.definition"
          :filter-type="cf.filterType"
          :meta="cf.meta"
          @change="onCustomFieldChange"
        />
      </div>
    </div>

    <div v-if="useAsDialog" class="flex justify-between">
      <UButton
        v-if="isFilterActive"
        label="Filter entfernen"
        icon="i-lucide-trash"
        color="neutral"
        variant="soft"
        class="rounded-full py-2 px-3"
        @click="removeFilter"
      />
      <div v-else class="flex-1" />
      <UButton
        label="Filter anwenden"
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
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState";
import { useCustomFieldFilters } from "~/composables/search/useCustomFieldFilters";
import {
  applyCatalogFilters,
  MatchStatus,
} from "~/composables/search/catalogFilters";
import { computeSliderStep } from "~/utils/sliderStep";
import CustomFieldFilter from "~/components/search/CustomFieldFilter.vue";
import FilterHistogramSlider from "~/components/search/FilterHistogramSlider.vue";
import FilterCheckboxGroup from "~/components/search/FilterCheckboxGroup.vue";

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
    default: false,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  cities: {
    type: Array,
    default: () => [],
  },
  distance: {
    type: Number,
    default: null,
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
  customFields: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(["filter"]);

// Results the search itself kept. Options and slider bounds derive from this
const searchResults = computed(() =>
  props.bookables.filter((b) => b.matchStatus !== MatchStatus.NO_MATCH),
);

//Filter Variables
const { isFilterActive } = useCatalogQueryState();
const _includeNonSuitable = ref(props.includeNonSuitable);
const _cities = ref(props.cities);
const _onlyPublicEvents = ref(props.onlyPublicEvents);
const _onlyRegistrationNeededEvents = ref(props.onlyRegistrationNeededEvents);
const _categories = ref(props.categories);

//Kategorien
//toDo - read from instance later !!!!
const categoryDefinitions = [
  {
    label: "Räume",
    value: "room",
  },
  {
    label: "Veranstaltungsorte",
    value: "event-location",
  },
  {
    label: "Geräte",
    value: "resource",
  },
  {
    label: "Tickets",
    value: "ticket",
  },
];
const possibleCategories = computed(() => {
  const counts = {};
  for (const b of facetMatches("cat")) {
    counts[b.item.type] = (counts[b.item.type] || 0) + 1;
  }
  return categoryDefinitions.map((c) => ({
    ...c,
    count: counts[c.value] || 0,
  }));
});

//Distanz
const _distance = ref(props.distance ?? 100);
watch(
  () => props.distance,
  (newVal) => {
    _distance.value = newVal;
  },
);

const distanceRange = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return props.distance != null ? [0, props.distance] : [0, 100];
  }

  const distances = props.bookables
    .filter(
      (b) =>
        b.matchStatus !== MatchStatus.NO_MATCH && b.item.distanceMeter != null,
    )
    .map((b) => b.item.distanceMeter);

  if (distances.length === 0) {
    return props.distance != null ? [0, props.distance] : [0, 100];
  }

  const maxDistanceKm = Math.max(...distances) / 1000;

  if (maxDistanceKm > props.distance) {
    return [0, Math.ceil(maxDistanceKm / 5) * 5];
  } else {
    return [0, props.distance];
  }
});

const dynamicDistanceStep = computed(() =>
  computeSliderStep(0, distanceRange.value[1], { minStep: 5 }),
);

//Price
const getMinPrice = (b) =>
  props.isEvent ? getEventMinPrice(b) : getBookableMinPrice(b);

const priceValues = computed(() => {
  return facetMatches("price")
    .map((b) => getMinPrice(b))
    .filter((p) => p != null && !isNaN(p));
});

const possiblePriceRange = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return [0, 100];
  }

  const validPrices = searchResults.value
    .map((b) => getMinPrice(b))
    .filter((price) => price !== undefined && price !== null && !isNaN(price));

  //set endpoints rounded to 5
  const minPrice =
    validPrices.length > 0 ? Math.floor(Math.min(...validPrices) / 5) * 5 : 0;
  const maxPrice =
    validPrices.length > 0 ? Math.ceil(Math.max(...validPrices) / 5) * 5 : 100;

  return [minPrice, maxPrice];
});

const dynamicPriceStep = computed(() =>
  computeSliderStep(possiblePriceRange.value[0], possiblePriceRange.value[1], {
    minStep: 5,
  }),
);
const dynamicMaxPrice = computed(() => {
  if (possiblePriceRange.value[1] === 0) {
    return 0;
  }
  const remainder = possiblePriceRange.value[1] % dynamicPriceStep.value;
  if (remainder === 0) {
    return possiblePriceRange.value[1];
  } else {
    return possiblePriceRange.value[1] + (dynamicPriceStep.value - remainder);
  }
});
const dynamicMinPrice = computed(() => {
  if (possiblePriceRange.value[0] === dynamicMaxPrice.value) {
    return 0;
  }
  return possiblePriceRange.value[0];
});

const _price = ref(
  props.price?.length === 2
    ? props.price
    : [dynamicMinPrice.value, dynamicMaxPrice.value],
);
// When the bounds move (a new search changes the prices), an untouched
// selection follows them and a narrowed one is clamped into them, so the
// user's price choice survives a search while other filters keep counting.
watch([dynamicMinPrice, dynamicMaxPrice], ([min, max], [oldMin, oldMax]) => {
  const [lo, hi] = _price.value;
  if (lo === oldMin && hi === oldMax) {
    _price.value = [min, max];
    return;
  }
  const nextLo = Math.min(Math.max(lo, min), max);
  const nextHi = Math.max(Math.min(hi, max), min);
  if (nextLo !== lo || nextHi !== hi) {
    _price.value = [nextLo, nextHi];
  }
});

function getBookableMinPrice(bookable) {
  if (bookable.matchStatus === MatchStatus.NO_MATCH) {
    return null;
  }
  //if search is initialized, return calculated price
  if (searchIsInitialized.value && bookable.calculatedPrice) {
    return bookable.calculatedPrice.userGrossPriceEur;
  }

  //else return min price from price categories but exclude holiday price categories
  const pricesWithoutHolidays = bookable.item?.priceCategories?.filter(
    (c) => !c.holidays || c.holidays.length === 0,
  );
  const minPrice = Math.min(
    ...(pricesWithoutHolidays.map((cat) => cat.priceEur) || []),
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
  if (event.matchStatus === MatchStatus.NO_MATCH) {
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

//Locations
const distanceValues = computed(() => {
  return facetBase("distance")
    .filter(
      (b) =>
        b.matchStatus !== MatchStatus.NO_MATCH && b.item.distanceMeter != null,
    )
    .map((b) => b.item.distanceMeter / 1000);
});

function countCities(wrappers) {
  const cityCount = {};
  for (const b of wrappers) {
    const city = extractCity(b.item.location);
    if (city) {
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
  }
  return cityCount;
}

// The list and its order come from every result the search kept; the count
// per city comes from the results the other filters leave over.
const possibleCities = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return [];
  }

  const allCounts = countCities(searchResults.value);
  const facetCounts = countCities(facetMatches("cities"));

  return Object.entries(allCounts)
    .sort(([a, ac], [b, bc]) => bc - ac || a.localeCompare(b))
    .map(([city]) => ({
      label: city,
      value: city.toLowerCase(),
      count: facetCounts[city] || 0,
    }));
});

function extractCity(location) {
  if (location && typeof location === "string") {
    return extractCityFromString(location);
  } else if (location && typeof location === "object") {
    if (location.address && location.address.city) {
      return location.address.city;
    } else if (location.display_address) {
      return extractCityFromString(location.display_address);
    }
  }
  return "";
}
function extractCityFromString(location) {
  if (!location) {
    return "";
  }
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

// Facet counts: each filter counts against the results every *other* filter
// leaves over. The local values are used so the dialog reflects a pending
//  selection before it is applied.
const priceCriteria = computed(() => {
  const sameAsPossible =
    _price.value?.length === 2 &&
    _price.value[0] === possiblePriceRange.value[0] &&
    _price.value[1] === possiblePriceRange.value[1];
  return sameAsPossible ? [] : _price.value;
});

const localCriteria = computed(() => ({
  inclNoSuitable: _includeNonSuitable.value,
  pubEv: _onlyPublicEvents.value,
  regEv: _onlyRegistrationNeededEvents.value,
  cat: _categories.value,
  cities: _cities.value,
  distance: _distance.value,
  hasLocation: props.distance != null,
  price: priceCriteria.value,
  customFields: _customFieldValues.value,
}));

function facetBase(skip) {
  return applyCatalogFilters(props.bookables, localCriteria.value, {
    isEvent: props.isEvent,
    getMinPrice,
    skip,
  });
}

function facetMatches(skip) {
  return facetBase(skip).filter((b) => b.matchStatus === MatchStatus.MATCH);
}

function instantFilter() {
  if (!props.useAsDialog) {
    onFilter();
  }
}
function onFilter() {
  const filter = {};

  if (!Array.isArray(_price.value) || _price.value.length !== 2) {
    _price.value = possiblePriceRange.value.slice();
  }

  filter.inclNoSuitable = _includeNonSuitable.value;
  filter.pubEv = _onlyPublicEvents.value;
  filter.regEv = _onlyRegistrationNeededEvents.value;
  filter.cat = _categories.value;
  filter.cities = _cities.value;
  filter.distance = _distance.value;
  filter.price = priceCriteria.value;
  filter.customFields = _customFieldValues.value;

  emit("filter", filter);
}

function removeFilter() {
  _includeNonSuitable.value = true;
  _onlyPublicEvents.value = false;
  _onlyRegistrationNeededEvents.value = false;
  _cities.value = [];
  _categories.value = [];
  _price.value = possiblePriceRange.value.slice();
  _distance.value = distanceRange.value[1];
  _customFieldValues.value = {};

  const filter = {};

  filter.inclNoSuitable = _includeNonSuitable.value;
  filter.pubEv = _onlyPublicEvents.value;
  filter.regEv = _onlyRegistrationNeededEvents.value;
  filter.cat = _categories.value;
  filter.cities = _cities.value;
  filter.distance = distanceRange.value[1];

  const sameAsPossible =
    _price.value?.length === 2 &&
    _price.value[0] === possiblePriceRange.value[0] &&
    _price.value[1] === possiblePriceRange.value[1];

  filter.price = sameAsPossible ? [] : _price.value;

  filter.customFields = {};

  emit("filter", filter);
}

// Custom Field Filter
const { aggregated: customFieldFilters } = useCustomFieldFilters(
  searchResults,
  {
    position: "sidebar",
    facetItems: (fieldId) => facetMatches(`cf:${fieldId}`),
  },
);
const sortedCustomFieldFilters = computed(() =>
  customFieldFilters.value.slice().sort((a, b) => {
    if (a.filterType === "checkbox" && b.filterType !== "checkbox") return -1;
    if (a.filterType !== "checkbox" && b.filterType === "checkbox") return 1;
    return 0;
  }),
);

const _customFieldValues = ref({ ...(props.customFields || {}) });

function onCustomFieldChange() {
  instantFilter();
}
</script>
<style scoped></style>

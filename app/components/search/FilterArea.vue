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
          v-if="!useAsDialog && isActive"
          icon="i-lucide-trash"
          variant="ghost"
          class="rounded-full py-2 px-3"
          :class="isActive ? '' : ''"
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
      <UCheckboxGroup
        v-model="_categories"
        :items="possibleCategories"
        :ui="{ label: 'text-base' }"
        @change="instantFilter"
      />
    </div>

    <!-- Orte -->
    <div v-if="possibleCities && possibleCities.length" class="my-7">
      <p class="mb-3">Orte</p>
      <UCheckboxGroup
        v-model="_cities"
        :items="possibleCities.slice(0, numberOfVisibleCities)"
        :ui="{ label: 'text-base' }"
        @change="instantFilter"
      >
        <template #label="{ item }">
          <div class="flex">
            {{ item.lable }}
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

    <!-- Distanz -->

    <div v-if="distance" class="my-7">
      <p class="mb-3">Distanz</p>
      <p class="mb-3">0 km - {{ _distance }} km</p>

      <div class="mx-2">
        <div
          v-if="
            distanceBars &&
            distanceBars.length > 0 &&
            distanceBars.some((p) => p > 0)
          "
          class="flex items-end justify-between mx-2"
          style="width: 100%; padding-right: 15px"
        >
          <div
            v-for="(count, index) in distanceBars"
            :key="index"
            class="w-full bg-primary opacity-40 mr-1"
            style="max-height: 50px"
            :style="{
              height: (count / Math.max(...distanceBars)) * 50 + 'px',
            }"
          />
        </div>

        <USlider
          v-model="_distance"
          :min="0"
          :max="distanceRange[1]"
          :step="dynamicDistanceStep"
          @change="instantFilter"
        />
      </div>
    </div>

    <!-- Preis -->
    <div class="my-7">
      <p class="mb-3">Preis</p>
      <p class="mb-3">€ {{ _price[0] }} - € {{ _price[1] }}</p>
      <div class="mx-2">
        <div
          v-if="priceBars.length > 0 && priceBars.some((p) => p > 0)"
          class="flex items-end justify-between mx-2"
          style="width: 100%; padding-right: 15px"
        >
          <div
            v-for="(count, index) in priceBars"
            :key="index"
            class="w-full bg-primary opacity-40 mr-1"
            style="max-height: 50px"
            :style="{
              height: (count / Math.max(...priceBars)) * 50 + 'px',
            }"
          />
        </div>

        <USlider
          v-model="_price"
          :min="dynamicMinPrice"
          :max="dynamicMaxPrice"
          :step="dynamicPriceStep"
          @change="instantFilter"
        />
      </div>
    </div>

    <div v-if="useAsDialog" class="flex justify-between">
      <UButton
        v-if="isActive"
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
import { useRoute } from "#imports";

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
});
const emit = defineEmits(["filter"]);

//Filter Variables
const isActive = computed(() => {
  const route = useRoute();
  const keysToCheck = [
    "inclNoSuitable",
    "pubEv",
    "regEv",
    "cities",
    "cat",
    "dist",
    "price",
  ];
  return route.query && keysToCheck.some((key) => key in route.query);
});
const _includeNonSuitable = ref(props.includeNonSuitable);
const _cities = ref(props.cities);
const _onlyPublicEvents = ref(props.onlyPublicEvents);
const _onlyRegistrationNeededEvents = ref(props.onlyRegistrationNeededEvents);
const _categories = ref(props.categories);

//Kategorien
//toDo - read from instance later !!!!
const possibleCategories = computed(() => {
  return [
    {
      value: "room",
      label: "Räume",
    },
    {
      value: "event-location",
      label: "Veranstaltungsorte",
    },
    {
      value: "resource",
      label: "Geräte",
    },
    {
      value: "ticket",
      label: "Tickets",
    },
  ];
});

//Distanz
const _distance = ref(props.distance || 100);
watch(
  () => props.distance,
  (newVal) => {
    _distance.value = newVal;
  },
);

const distanceRange = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return props.distance ? [0, props.distance] : [0, 100];
  }

  const distances = props.bookables
    .filter((b) => !!b.item.distanceMeter)
    .map((b) => b.item.distanceMeter);

  const maxDistanceKm = Math.max(...distances) / 1000;

  if (maxDistanceKm > props.distance) {
    return [0, Math.ceil(maxDistanceKm / 5) * 5];
  } else {
    return [0, props.distance];
  }
});

const dynamicDistanceStep = computed(() => {
  if (distanceRange.value[1] === 0) {
    return 0;
  }

  let step = Math.ceil(distanceRange.value[1] / 20); // 20 steps max
  step = Math.max(5, Math.ceil(step / 5) * 5);
  return step;
});

const distanceBars = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return [];
  }

  //set number of bars depending on distance range
  const barsCount =
    Math.ceil(distanceRange.value[1] / dynamicDistanceStep.value) || 1;

  const bars = new Array(barsCount).fill(0);
  const range = distanceRange.value[1];

  props.bookables.forEach((b) => {
    if (!b.item.distanceMeter) {
      return;
    }
    const distanceKm = b.item.distanceMeter / 1000;
    if (distanceKm === 0) {
      //put into first bar
      bars[0]++;
      return;
    }
    const index = Math.min(
      Math.floor((distanceKm / range) * barsCount),
      barsCount - 1,
    );
    bars[index]++;
  });

  return bars;
});

//Preis
const possiblePriceRange = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return [0, 100];
  }

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

const dynamicPriceStep = computed(() => {
  const range = possiblePriceRange.value[1] - possiblePriceRange.value[0];
  if (range === 0) {
    return possiblePriceRange.value[0];
  }

  let step = Math.ceil(range / 20); // 20 steps max
  step = Math.max(5, Math.ceil(step / 5) * 5);
  return step;
});
const dynamicMaxPrice = computed(() => {
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
const priceBars = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return [];
  }

  //set number of bars depending on price range
  const barsCount =
    Math.ceil(
      (dynamicMaxPrice.value - possiblePriceRange.value[0]) /
        dynamicPriceStep.value,
    ) || 1;

  const bars = new Array(barsCount).fill(0);
  const range = dynamicMaxPrice.value - possiblePriceRange.value[0];

  props.bookables.forEach((b) => {
    let minPrice = null;
    if (!props.isEvent) {
      minPrice = getBookableMinPrice(b);
    } else {
      minPrice = getEventMinPrice(b);
    }
    //sort price into bars
    if (minPrice !== null) {
      if (minPrice === possiblePriceRange.value[0]) {
        //put into first bar
        bars[0]++;
        return;
      }
      const index = Math.min(
        Math.floor(
          ((minPrice - possiblePriceRange.value[0]) / range) * barsCount,
        ),
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

//Orte
const possibleCities = computed(() => {
  if (!props.bookables || props.bookables.length === 0) {
    return [];
  }

  const cityCount = {};
  props.bookables.forEach((b) => {
    let city = "";
    if (props.isEvent && b.status === "suitable") {
      city = extractCity(b.item.eventAddress.city); //toDo - adjust for new location object !!!
    } else if (b.status === "suitable") {
      city = extractCity(b.item.location);
    }

    if (city) {
      cityCount[city] = (cityCount[city] || 0) + 1;
    }
  });

  return Object.entries(cityCount)
    .map(([value, count]) => ({
      lable: value,
      value: value.toLowerCase(),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
});

const numberOfVisibleCities = ref(5); //toDo - später auf 10 setzen!!!!!!!!! ***
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

  const sameAsPossible =
    _price.value?.length === 2 &&
    _price.value[0] === possiblePriceRange.value[0] &&
    _price.value[1] === possiblePriceRange.value[1];

  filter.inclNoSuitable = _includeNonSuitable.value;
  filter.pubEv = _onlyPublicEvents.value;
  filter.regEv = _onlyRegistrationNeededEvents.value;
  filter.cat = _categories.value;
  filter.cities = _cities.value;
  filter.distance = _distance.value;
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
  _distance.value = distanceRange.value[1];

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

  emit("filter", filter);
}
</script>
<style scoped></style>

<template>
  <div class="w-full group content-center dark:bg-gray-700">
    <div class="flex justify-between">
      <UInputMenu
        v-model="model"
        v-model:search-term="searchTerm"
        :items="displayItems"
        name="no-autofill-address"
        autocomplete="new-password"
        icon="i-lucide-map-pin"
        size="lg"
        variant="ghost"
        placeholder="Adresse"
        class="w-full bg-white dark:bg-gray-700"
        :ui="{
          base: 'w-full pr-1 placeholder:text-gray-400 dark:text-gray-200 hover:bg-transparent rounded-none rounded-l-md',
          leadingIcon: 'text-gray-400 dark:text-gray-200',
          content: 'glass w-full',
        }"
        label-key="display_address"
        trailing-icon="none"
        :loading="loading"
        @select="onSelect()"
      >
        <template #item="{ item }">
          <div v-if="item.isManualEntry" class="flex gap-2 hover:text-primary">
            <div class="content-center">
              <UIcon name="i-lucide-pencil" class="text-gray-500" />
            </div>
            <div class="flex flex-col">
              <span>{{ item.display_address }}</span>
              <span
                v-if="item.isManualEntry"
                class="text-xs text-gray-500 italic"
              >
                Adresse ohne Koordinaten und Umkreissuche nutzen
              </span>
            </div>
          </div>
          <div v-else class="hover:text-primary">
            {{ item.display_address }}
          </div>
        </template>
      </UInputMenu>
      <div class="flex">
        <DistanceSelection
          v-if="hasCoordinates"
          v-model="selectedDistance"
          class="w-20"
          @set-distance="updateDistance"
        />
        <ClearButton :show-clear-button="hasAddress" @clear="onClear" />
      </div>
    </div>
  </div>
</template>
<script setup>
import ClearButton from "~/components/inputs/ClearButton.vue";
import DistanceSelection from "~/components/inputs/DistanceSelection.vue";

const model = defineModel();
const props = defineProps({
  distance: {
    type: Number,
    default: 20,
  },
});
const emit = defineEmits(["changeDistance"]);

const suggestions = ref([]);
const loading = ref(false);
const searchTerm = ref("");
const originalDisplayAddress = ref(model.value);

const selectedAddress = ref({
  display_address: "model.value ? model.value.display_address : 'model.value'",
  coordinates: null,
  address: null,
  meta: {
    source: null,
    fetched_at: null,
  },
});
const hasAddress = computed(() => {
  if (model.value && typeof model.value === "string") {
    return true;
  }
  if (
    model.value &&
    typeof model.value === "object" &&
    model.value.display_address
  ) {
    return true;
  }
  return false;
});
const hasCoordinates = computed(() => {
  return (
    model.value.coordinates &&
    model.value.coordinates.points &&
    model.value.coordinates.points[0] !== 0 &&
    model.value.coordinates.points[1] !== 0
  );
});
const selectedDistance = ref(props.distance);
const debounceTimer = ref(null);

/*
Checks if manual option should be shown
 */
const canShowManualOption = computed(() => {
  return (
    searchTerm.value &&
    searchTerm.value.length >= 3 &&
    !loading.value &&
    //Don´t show if query exactly matches an existing result
    !suggestions.value.some((s) => s.display_address === searchTerm.value)
  );
});

/*
Items for selection - adds manual option at the end
 */
const displayItems = computed(() => {
  if (!canShowManualOption.value) {
    return suggestions.value;
  }
  return [...suggestions.value, createManualEntry(searchTerm.value)];
});

watch(
  searchTerm,
  (newQuery) => {
    if (
      selectedAddress.value &&
      newQuery === selectedAddress.value.display_address
    ) {
      return;
    }

    if (!newQuery || newQuery.length < 3) {
      if (!selectedAddress.value) {
        suggestions.value = [];
      }
      return;
    }

    if (newQuery) {
      const addresObj = parseIncomingValue(newQuery);

      if (addresObj) {
        selectedAddress.value = addresObj;
        suggestions.value = [addresObj];
        // originalDisplayAddress.value = addresObj.display_address;
      }
    }

    clearTimeout(debounceTimer.value);
    debounceTimer.value = setTimeout(() => {
      searchAddress(newQuery);
    }, 300);
  },
  { immediate: true },
);

/*
Creates a manual entry
 */
function createManualEntry(text) {
  return {
    display_address: text,
    coordinates: null,
    address: null,
    meta: {
      source: "manual",
      fetched_at: new Date().toISOString(),
    },
    isManualEntry: true,
  };
}

/*
Parses incoming value - supports both string and object formats for backward compatibility
*/
function parseIncomingValue(val) {
  if (typeof val === "string") {
    return {
      display_address: val,
      isLegacy: true,
    };
  }

  if (typeof val !== "object") return null;

  if (val.coordinates?.points) {
    return {
      display_address: val.display_address,
      coordinates: val.coordinates,
      address: val.address,
      meta: val.meta,
      isLegacy: false,
    };
  }

  const displayAddr = val.display_address || val.display_name;
  if (displayAddr) {
    return {
      display_address: displayAddr,
      coordinates: buildGeoLocation(val.lat, val.lon || val.lng),
      address: val.address || null,
      isLegacy: true,
    };
  }

  return null;
}

/*
Builds GeoJSON Point from lat/lon
 */
function buildGeoLocation(lat, lon) {
  if (!lat || !lon) return null;

  return {
    type: "Point",
    points: [parseFloat(lon), parseFloat(lat)],
  };
}

/*
Builds a display address from the Nominatim response, prioritizing structured address components when available
 */
function buildDisplayAddress(item) {
  if (!item.address) {
    return item.display_name;
  }

  const addr = item.address;
  const street = [addr.road, addr.house_number].filter(Boolean).join(" ");
  const city =
    addr.city || addr.town || addr.village || addr.municipality || addr.county;
  const plzCity = [addr.postcode, city].filter(Boolean).join(" ");
  const country = addr.country;

  return [street, plzCity, country].filter(Boolean).join(", ");
}

/*
Transforms Nominatim response item into the desired database format, extracting structured address components and geolocation
 */
function transformToDbFormat(item) {
  const addr = item.address || {};

  return {
    coordinates: buildGeoLocation(item.lat, item.lon),
    display_address: buildDisplayAddress(item),
    address: {
      street: addr.road || null,
      house_number: addr.house_number || null,
      postcode: addr.postcode || null,
      city: addr.city || addr.town || addr.village || null,
      suburb: addr.suburb || addr.neighbourhood || null,
      state: addr.state || null,
      country: addr.country || null,
      country_code: addr.country_code || null,
    },
    meta: {
      source: "nominatim",
      place_id: item.place_id,
      fetched_at: new Date().toISOString(),
    },
  };
}

/*
Performs the address search using Nominatim API, handling loading state and errors gracefully
 */
async function searchAddress(query) {
  loading.value = true;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
      countrycodes: "de",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "Accept-Language": "de",
        },
      },
    );

    const data = await response.json();
    suggestions.value = data.map((item) => transformToDbFormat(item));

    if (originalDisplayAddress.value) {
      const matchedSuggestion = suggestions.value.find(
        (s) => s.display_address === originalDisplayAddress.value,
      );
      if (matchedSuggestion) {
        onSelect(matchedSuggestion);
      }
    }
  } catch (error) {
    console.error("Adress-Lookup fehlgeschlagen:", error);
    suggestions.value = [];
  } finally {
    loading.value = false;
  }
}

/*
Handles selection of an address item, supporting both manual entries and normal selections, and updates the model accordingly
 */
function onSelect(item) {
  if (!item) return;
  // manual selection - only display address is set, no coordinates
  if (item.isManualEntry) {
    const locationData = {
      coordinates: null,
      display_address: item.display_address,
      address: null,
      meta: {
        source: "manual",
        fetched_at: new Date().toISOString(),
      },
    };

    originalDisplayAddress.value = item.display_address;
    model.value = locationData;

    return;
  }

  // selection from API - can be in legacy format (string) or new format (object with coordinates and address)
  const locationData = item.isLegacy
    ? {
        coordinates: item.coordinates,
        display_address: item.display_address,
        address: item.address || null,
        meta: {
          source: "legacy",
          fetched_at: new Date().toISOString(),
        },
      }
    : {
        coordinates: item.coordinates,
        display_address: item.display_address,
        address: item.address,
        meta: item.meta,
      };

  originalDisplayAddress.value = item.display_address;
  model.value = locationData;
}

function updateDistance() {
  emit("changeDistance", selectedDistance.value);
}

/*
Handles clearing the selection, resetting the model and search term to initial state
 */
function onClear() {
  model.value = {
    display_address: "",
    coordinates: null,
    address: null,
    meta: {
      source: null,
      fetched_at: null,
    },
  };
  suggestions.value = [];
  searchTerm.value = "";
  originalDisplayAddress.value = "";
  selectedDistance.value = 20;
}
</script>
<style scoped></style>

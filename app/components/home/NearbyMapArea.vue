<template>
  <section v-if="allPlaced.length > 0" style="padding: 50px 0">
    <div class="md:flex items-end justify-between mb-5 gap-4">
      <div class="space-y-1.5">
        <h2 class="text-2xl font-bold">{{ $t("home.nearby.title") }}</h2>
        <p class="text-gray-600 dark:text-gray-400" aria-live="polite">
          {{
            showsNearby
              ? $t(
                  "home.nearby.countNearby",
                  { count: shown.length, radius: NEARBY_RADIUS_KM },
                  shown.length,
                )
              : $t("home.nearby.count", shown.length)
          }}
        </p>
      </div>
      <UButton
        variant="ghost"
        :label="$t('home.nearby.openSearch')"
        trailing-icon="i-lucide-chevron-right"
        :to="tenantTo({ path: '/search', query: { view: 'map' } })"
        class="my-2 md:my-0"
      />
    </div>

    <!-- The search page's map without its list, filter and full screen. -->
    <div class="relative">
      <ResultsMap :bookables="shown" compact />
      <!-- Small, on the map like its zoom buttons: the browser asks for the
           position only after this click. A second click shows all again. -->
      <UButton
        size="sm"
        icon="i-lucide-locate-fixed"
        :loading="locationState === 'locating'"
        :label="$t('home.nearby.useLocation')"
        :aria-pressed="locationState === 'located'"
        class="absolute right-4 top-4 z-1001 rounded-lg py-1.5 px-2.5 shadow-md"
        :class="
          locationState === 'located'
            ? 'bg-primary/80'
            : 'glass text-black dark:text-white'
        "
        :style="
          locationState === 'located'
            ? { color: 'var(--ui-primary-contrast)' }
            : undefined
        "
        @click="toggleLocation"
      />
    </div>

    <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
      <template v-if="noneNearby">
        {{ $t("home.nearby.noneNearby", { radius: NEARBY_RADIUS_KM }) }}
      </template>
      <template v-else-if="locationState === 'unavailable'">
        {{ $t("home.nearby.locationUnavailable") }}
      </template>
      {{ $t("home.nearby.hint") }}
    </p>
  </section>
</template>

<script setup>
import ResultsMap from "~/components/search/ResultsMap.vue";
import { isBookableOffer, mergeOffers } from "~/composables/search/offer";
import { MatchStatus } from "~/composables/search/catalogFilters";
import { NEARBY_RADIUS_KM, placedOffers } from "~/utils/nearbyOffers.js";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  events: {
    type: Array,
    default: () => [],
  },
});

const { tenantTo } = useTenantRoute();

// The same Offers the search page puts on its map, all of them matching.
const offers = computed(() =>
  mergeOffers(props.bookables, props.events).map((item) => ({
    item,
    isBookable: isBookableOffer(item),
    matchStatus: MatchStatus.MATCH,
  })),
);

const allPlaced = computed(() => placedOffers(offers.value));

/**
 * Where the device's position stands: `idle` while the map shows all Offers,
 * `located` with a position, `unavailable` after a request that was refused
 * or could not be answered.
 */
const locationState = ref("idle");
const position = ref(null);

const nearby = computed(() =>
  position.value ? placedOffers(offers.value, position.value) : [],
);
// No Offer within the radius: the map shows all of them, and says so.
const noneNearby = computed(
  () => locationState.value === "located" && nearby.value.length === 0,
);
const showsNearby = computed(
  () => locationState.value === "located" && nearby.value.length > 0,
);
const shown = computed(() =>
  showsNearby.value ? nearby.value : allPlaced.value,
);

function locate() {
  if (!navigator.geolocation) {
    locationState.value = "unavailable";
    return;
  }
  locationState.value = "locating";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      position.value = { lat: coords.latitude, lng: coords.longitude };
      locationState.value = "located";
    },
    () => {
      locationState.value = "unavailable";
    },
    { maximumAge: 10 * 60 * 1000, timeout: 10000 },
  );
}

function toggleLocation() {
  if (locationState.value === "located") {
    position.value = null;
    locationState.value = "idle";
    return;
  }
  locate();
}

// A position the person has already shared is used at once; otherwise the
// map shows all Offers until the button is clicked.
onMounted(async () => {
  if (!navigator.geolocation) return;
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    if (status?.state === "granted") locate();
  } catch {
    // Without the Permissions API the button asks on a click.
  }
});
</script>

<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader
        title="Ihre Schlüssel"
        description="Öffnen und schließen Sie Türen im Zeitraum Ihrer Buchung."
        class="mb-3 md:mb-0"
      />
      <!-- toDo - Suchleiste für Schlüssel??? -->
    </div>

    <!-- Help Information -->
    <GeneralHelpSection :tenant-ids="bookings.map((b) => b.tenantId)" />

    <!-- View Switch -->
    <div class="flex my-5 justify-between">
      <div class="space-x-2">
        <UButton
          icon="i-lucide-list"
          :variant="viewMode === 'list' ? 'subtle' : 'ghost'"
          label="Liste"
          class="p-3 cursor-pointer"
          @click="() => (viewMode = 'list')"
        />
        <!--
        <UButton
          icon="i-lucide-map"
          :variant="viewMode === 'map' ? 'subtle' : 'ghost'"
          label="Raumkarte"
          class="p-3 cursor-pointer"
          disabled
          @click="() => (viewMode = 'map')"
        />
        -->
      </div>
      <USelect
        v-model="bookingFilter"
        :items="filterOptions"
        :content="{
          align: 'center',
          side: 'bottom',
          sideOffset: 8,
        }"
        class="w-28 lg:w-36"
      />
    </div>

    <div v-if="viewMode === 'list'" class="space-y-3 mb-15">
      <!--
        `loadingKey` and `errorMessage` were already kept up to date by
        `withLoading`; they just had no way into the template. The list is the
        one place that decides between skeleton, failure, emptiness and content.
      -->
      <MobileKeyBookingList
        :bookings="bookings"
        :loading="loadingKey === 'bookings'"
        :error="errorMessage"
      />
    </div>
    <div v-if="viewMode === 'map'">
      <USkeleton class="h-64 w-full rounded-lg" />
    </div>
  </div>
</template>

<script setup>
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useAccessClock } from "~/composables/useAccessClock.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { compareByAccessWindow } from "~/utils/accessWindow.js";
import GeneralHelpSection from "~/components/mobileKey/GeneralHelpSection.vue";
import MobileKeyBookingList from "~/components/mobileKey/MobileKeyBookingList.vue";

definePageMeta({
  requiresAuth: true,
  layout: "panel",
  navigation: "user",
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.mobileKey"));

const { getAccessBookings } = useAccessPoints();
const tenantStore = useTenantStore();

const viewMode = ref("list");

const filterOptions = [
  { label: "Aktive", value: "active" },
  { label: "Kommende", value: "upcoming" },
  { label: "Vergangene", value: "past" },
  { label: "Alle", value: "all" },
];
const bookingFilter = ref("active");
watch(bookingFilter, () => {
  loadBookings();
});

const includeAccessPoints = ref(true);
const includeLockers = ref(true);
const includeBuffer = ref(true);
const includeEligibility = ref(true);

const bookings = ref([]);

const accessPointsByBooking = ref({});

const lastResponse = ref(null);
const errorMessage = ref("");
/**
 * Already loading on the first paint: `onMounted` below fetches unconditionally,
 * so the fetch is a fact before it starts. Starting empty would let the list
 * say "Keine Schlüssel gefunden" for the tick between render and mount - the
 * very sentence this is here to prevent.
 */
const loadingKey = ref("bookings");

const responsePayload = (response) => response?.data ?? response;

/**
 * Fetches the list and puts it in place, sorted by the booking envelope from
 * the eligibility (`accessWindow`, backend 4.3): active, upcoming, past -
 * see `compareByAccessWindow`. The 60-minute buffer the sort used to guess
 * is gone; the envelope is the buffer the backend actually applied.
 */
const fetchBookings = async () => {
  const response = await getAccessBookings({
    filter: bookingFilter.value,
    includeAccessPoints: includeAccessPoints.value ? "true" : "false",
    includeLockers: includeLockers.value ? "true" : "false",
    includeBuffer: includeBuffer.value ? "true" : "false",
    includeEligibility: includeEligibility.value ? "true" : "false",
  });

  lastResponse.value = response;

  bookings.value = (responsePayload(response) || []).sort(
    compareByAccessWindow(Date.now()),
  );

  if (includeAccessPoints.value) {
    for (const booking of bookings.value) {
      if (booking.accessPoints?.length) {
        accessPointsByBooking.value[booking.id] = booking.accessPoints;
      }
    }
  }
};

const loadBookings = async () => {
  await withLoading("bookings", fetchBookings);
};

/**
 * The reload a window start asks for: only the server can put a door into
 * the remote-operable list. Silent - no skeleton, the list stays in place and
 * the result is swapped in; a reload that fails keeps the old state and says
 * nothing. A load already showing its skeleton is not doubled.
 */
const reloadSilently = async () => {
  if (loadingKey.value) {
    return;
  }

  try {
    await fetchBookings();
  } catch {
    // The list on the screen is still the truth from the last load.
  }
};

/**
 * The page's clock, handed to every key row and to the sheet
 * (`useAccessNow`). A window end is client-side alone - badge, line and
 * button follow `now`. A window start reloads silently, as does a return to
 * the tab after a boundary went by while it was hidden.
 */
const doors = computed(() =>
  bookings.value.flatMap((booking) => booking.accessPoints ?? []),
);
useAccessClock(doors, {
  onCrossing({ starts, resumed }) {
    if (starts > 0 || resumed) {
      reloadSilently();
    }
  },
});

onMounted(() => {
  // Nothing else fills the tenant store on a direct visit; the help section
  // and the provider contacts read from it.
  tenantStore.fetchTenants();
  loadBookings();
});

const withLoading = async (key, callback) => {
  errorMessage.value = "";
  loadingKey.value = key;

  try {
    await callback();
  } catch (error) {
    errorMessage.value =
      error?.statusMessage || error?.message || "Unbekannter API-Fehler";
  } finally {
    loadingKey.value = "";
  }
};
</script>

<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader
        :title="$t('mobileKey.yourKeys')"
        :description="$t('mobileKey.yourKeysDescription')"
        class="mb-3 md:mb-0"
      />
    </div>

    <!-- Help Information -->
    <GeneralHelpSection :tenant-ids="bookings.map((b) => b.tenantId)" />

    <!-- View Switch -->
    <div class="flex my-5 justify-between">
      <div class="space-x-2">
        <UButton
          icon="i-lucide-list"
          :variant="viewMode === 'list' ? 'subtle' : 'ghost'"
          :label="$t('mobileKey.viewList')"
          class="px-3"
          @click="() => (viewMode = 'list')"
        />
        <!--
        <UButton
          icon="i-lucide-map"
          :variant="viewMode === 'map' ? 'subtle' : 'ghost'"
          :label="$t('mobileKey.viewMap')"
          class="p-3"
          disabled
          @click="() => (viewMode = 'map')"
        />
        -->
      </div>

      <div class="flex space-x-2">
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
        <!-- The search reads the bookable's title, the booking id and the
           address.-->
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          size="md"
          variant="outline"
          :placeholder="$t('mobileKey.searchPlaceholder')"
          :aria-label="$t('mobileKey.searchPlaceholder')"
        />
        <ListFilter
          :tenants="tenants"
          :is-disabled="!shownBookings.length"
          @set-filter="setFilter"
        />
      </div>
    </div>

    <div v-if="viewMode === 'list'" class="space-y-3 mb-15">
      <UCard v-if="bookings.length && !shownBookings.length">
        <div class="flex flex-col items-center justify-center py-10">
          <UIcon
            name="i-lucide-filter-x"
            class="w-12 h-12 text-neutral-400 mb-3"
          />
          <p class="text-sm text-neutral-500">
            {{ $t("mobileKey.noMatches") }}
          </p>
        </div>
      </UCard>
      <MobileKeyBookingList
        v-else
        :bookings="shownBookings"
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
import ListFilter from "~/components/user/ListFilter.vue";
import {
  filterAccessBookingsByTenant,
  searchAccessBookings,
  tenantsOfAccessBookings,
} from "~/utils/accessBookingList.js";

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

const filterOptions = computed(() => [
  { label: t("booking.filter.active"), value: "active" },
  { label: t("booking.filter.upcoming"), value: "upcoming" },
  { label: t("booking.filter.past"), value: "past" },
  { label: t("booking.filter.all"), value: "all" },
]);
const bookingFilter = ref("active");
watch(bookingFilter, () => {
  loadBookings();
});

const includeAccessPoints = ref(true);
const includeLockers = ref(true);
const includeBuffer = ref(true);
const includeEligibility = ref(true);

const bookings = ref([]);

// Search and provider filter over the loaded list, both client-side; the
// period select above reloads from the backend as before.
const searchQuery = ref("");
const filter = ref({ tenantIds: [] });

function setFilter(newFilter) {
  filter.value = newFilter;
}

const tenants = computed(() =>
  tenantsOfAccessBookings(
    bookings.value,
    (id) => tenantStore.getTenantById(id)?.name,
  ),
);

const shownBookings = computed(() =>
  filterAccessBookingsByTenant(
    searchAccessBookings(bookings.value, searchQuery.value),
    filter.value.tenantIds,
  ),
);

const accessPointsByBooking = ref({});

const lastResponse = ref(null);
const errorMessage = ref("");

const loadingKey = ref("bookings");

const responsePayload = (response) => response?.data ?? response;

/**
 * Fetches the list and puts it in place, sorted by the booking envelope from
 * the eligibility: active, upcoming, past.
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
      error?.statusMessage || error?.message || t("mobileKey.unknownApiError");
  } finally {
    loadingKey.value = "";
  }
};
</script>

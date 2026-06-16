<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader
        title="Ihre Schlüssel"
        description="Öffnen und schließen Sie Türen im Zeitraum Ihrer Buchung."
        class="mb-3 md:mb-0"
      />
      <!-- Suchleiste für Schlüssel??? -->
    </div>

    <!-- Help Information -->
    <div
      class="rounded-lg items-center border border-primary bg-primary/10 p-3"
    >
      <div class="flex gap-3 rounded-lg items-center">
        <div class="">
          <UIcon
            name="i-lucide-circle-question-mark"
            size="28"
            class="text-primary"
          />
        </div>

        <div>
          <h3 class="text-md font-semibold">
            Schlüssel nicht sichtbar oder Tür-Problem?
          </h3>
          <p class="text-sm my-1">
            Es werden nur Türen angezeigt, für die Sie aktuell eine Buchung mit
            Schließberechtigung haben. Fehlt ein Schlüssel oder lässt sich eine
            Tür nicht öffnen, hilft Ihnen unser Support weiter.
          </p>

          <button
            type="button"
            class="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary underline"
            @click="showHelpContact = !showHelpContact"
          >
            Hilfe &amp; Kontakt anzeigen
          </button>
        </div>
      </div>

      <div v-if="showHelpContact" class="mt-3 mx-10 space-y-2 text-sm">
        <USeparator color="primary" type="solid" size="md" class="w-full" />

        <!-- toDo - dynamisch auslesen?!?!? -->
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-phone" size="16" class="text-primary" />
          <div>
            <span> Telefon-Support: </span>
            <br class="sm:hidden" >
            <a href="tel:04315550123" class="text-primary font-bold"
              >0431 555 0123</a
            >
            <span>(Mo-So, 7-22 Uhr) </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-mail" size="16" class="text-primary" />
          <div>
            <span> E-Mail: </span>
            <br class="sm:hidden" >
            <a
              href="mailto: support@ecc-digital.de"
              class="text-primary font-bold"
              >support@ecc-digital.de</a
            >
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-wrench" size="16" class="text-primary" />
          <div>
            <span> Hausmeister vor Ort: </span>
            <br class="sm:hidden" >
            <span>Klingel am Haupteingang</span>
          </div>
        </div>
      </div>
    </div>

    <!-- View Switch -->
    <div class="flex my-5 gap-2">
      <UButton
        icon="i-lucide-list"
        :variant="viewMode === 'list' ? 'subtle' : 'ghost'"
        label="Liste"
        class="p-3 cursor-pointer"
        @click="() => (viewMode = 'list')"
      />
      <UButton
        icon="i-lucide-map"
        :variant="viewMode === 'map' ? 'subtle' : 'ghost'"
        label="Raumkarte"
        class="p-3 cursor-pointer"
        @click="() => (viewMode = 'map')"
      />
    </div>

    <div v-if="viewMode === 'list'" class="space-y-3">
      <UCard v-for="booking in bookings" :key="booking.id">
        <template #header>
          <div
            class="flex gap-3 items-center"
          >
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <UIcon name="i-lucide-key" class="w-5 h-5 text-primary font-bold" />
            </div>

            <div>
              <h2 class="text-lg font-semibold">{{booking.leadBookable?.title || 'Unbekanntes Buchungsobjekt'}}</h2>
              <p class="text-sm text-neutral-500">
                #{{booking.id}}
                &middot;
                Tenant: {{ getTenantName(booking.tenantId) }}
                <!--
                Status:
                {{ booking.state || bookingStateLabel(booking) }}
                -->
              </p>
            </div>
            <!-- toDo - Badge für aktuellen Status -->
          </div>
        </template>
        <div class="flex">
        </div>
      </UCard>
    </div>
    <div v-if="viewMode === 'map'">
      <USkeleton class="h-64 w-full rounded-lg" />
    </div>
  </div>
</template>

<script setup>
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";

definePageMeta({
  requiresAuth: true,
  layout: "panel",
  navigation: "user",
  hero: {
    height: "sm",
    showOnMobile: true,
    staticSubtitle: "Mobile Key",
  },
});

const {
  getAccessBookings,
  getBookingsForAccessPoint,
  getAccessPoints,
  open,
  unlatch,
  close,
  getStatus,
  pollOpenStatus,
} = useAccessPoints();
const { getTenantName } = useTenant();

const showHelpContact = ref(false);
const viewMode = ref("list");

const filterOptions = [
  { label: "Aktive", value: "active" },
  { label: "Kommende", value: "upcoming" },
  { label: "Vergangene", value: "past" },
  { label: "Alle", value: "all" },
];

const bookingFilter = ref("active");
const accessPointIdInput = ref("");
const includeAccessPoints = ref(true);
const includeLockers = ref(true);
const includeBuffer = ref(true);
const bookings = ref([]);
const accessPointsByBooking = ref({});
const visibleJson = ref({});
const responses = ref({});
const openProcessIds = ref({});
const lastResponse = ref(null);
const errorMessage = ref("");
const loadingKey = ref("");

const responsePayload = (response) => response?.data ?? response;

const loadBookings = async () => {
  await withLoading("bookings", async () => {
    const response = await getAccessBookings({
      filter: bookingFilter.value,
      includeAccessPoints: includeAccessPoints.value ? "true" : "false",
      includeLockers: includeLockers.value ? "true" : "false",
      includeBuffer: includeBuffer.value ? "true" : "false",
    });

    lastResponse.value = response;
    bookings.value = responsePayload(response) || [];

    if (includeAccessPoints.value) {
      for (const booking of bookings.value) {
        if (booking.accessPoints?.length) {
          accessPointsByBooking.value[booking.id] = booking.accessPoints;
        }
      }
    }
  });
};

onMounted(() => {
  loadBookings();
});

const loadBookingsForAccessPoint = async () => {
  const accessPointId = accessPointIdInput.value.trim();
  if (!accessPointId) return;

  await withLoading("ap-bookings", async () => {
    const response = await getBookingsForAccessPoint(accessPointId, {
      filter: bookingFilter.value,
      includeAccessPoints: includeAccessPoints.value ? "true" : "false",
      includeLockers: includeLockers.value ? "true" : "false",
      includeBuffer: includeBuffer.value ? "true" : "false",
    });

    lastResponse.value = response;
    bookings.value = responsePayload(response) || [];

    if (includeAccessPoints.value) {
      for (const booking of bookings.value) {
        if (booking.accessPoints?.length) {
          accessPointsByBooking.value[booking.id] = booking.accessPoints;
        }
      }
    }
  });
};

const loadAccessPoints = async (booking) => {
  await withLoading(`points:${booking.id}`, async () => {
    const response = await getAccessPoints(booking.tenantId, booking.id);
    lastResponse.value = response;
    accessPointsByBooking.value[booking.id] = responsePayload(response) || [];
  });
};

const runAction = async (action, booking, accessPoint) => {
  await withLoading(actionKey(action, booking, accessPoint), async () => {
    let response;

    if (action === "open") {
      response = await open(booking.tenantId, accessPoint.id, booking.id);
      const payload = responsePayload(response);

      if (payload?.openProcessId) {
        openProcessIds.value[processKey(booking, accessPoint)] =
          payload.openProcessId;
      }
    } else if (action === "unlatch") {
      response = await unlatch(booking.tenantId, accessPoint.id, booking.id);
    } else if (action === "close") {
      response = await close(booking.tenantId, accessPoint.id, booking.id);
    } else if (action === "status") {
      response = await getStatus(booking.tenantId, accessPoint.id, booking.id);
    } else if (action === "poll") {
      response = await pollOpenStatus(
        booking.tenantId,
        accessPoint.id,
        booking.id,
        openProcessIds.value[processKey(booking, accessPoint)],
      );
    }

    lastResponse.value = response;
    responses.value[processKey(booking, accessPoint)] = response;
  });
};

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

const accessPointsForBooking = (booking) =>
  accessPointsByBooking.value[booking.id] || [];

const canOperate = (accessPoint) => {
  if (!accessPoint.accessFrom || !accessPoint.accessTo) {
    return true;
  }

  const now = Date.now();
  return now >= accessPoint.accessFrom && now <= accessPoint.accessTo;
};

const processKey = (booking, accessPoint) => `${booking.id}:${accessPoint.id}`;

const actionKey = (action, booking, accessPoint) =>
  `${action}:${processKey(booking, accessPoint)}`;

const toggleJson = (key) => {
  visibleJson.value[key] = !visibleJson.value[key];
};

const bookingStateLabel = (booking) => {
  const now = Date.now();

  if (booking.timeBegin && now < booking.timeBegin) {
    return "upcoming";
  }

  if (booking.timeEnd && now > booking.timeEnd) {
    return "past";
  }

  return "active";
};

const formatDate = (value) => {
  if (!value) {
    return "unbekannt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const pretty = (value) => JSON.stringify(value, null, 2);
</script>

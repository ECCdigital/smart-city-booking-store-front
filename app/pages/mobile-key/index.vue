<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <h1 class="text-3xl font-bold">MobileKey</h1>
      <p class="mt-2 text-neutral-600 dark:text-neutral-300">
        Testbereich für Buchungen mit Schließberechtigungen und Access-Point
        Interaktionen.
      </p>
    </div>

    <UCard class="mb-6">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">Buchungen laden</h2>
            <p class="text-sm text-neutral-500">
              Lädt tenant-übergreifend Buchungen mit Schließberechtigung.
            </p>
          </div>
          <UButton
            :loading="loadingKey === 'bookings'"
            icon="i-lucide-refresh-cw"
            label="Buchungen laden"
            @click="loadBookings"
          />
        </div>
      </template>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <UFormField label="Filter">
          <USelect v-model="bookingFilter" :items="filterOptions" />
        </UFormField>

        <UCheckbox
          v-model="includeAccessPoints"
          label="Access-Points einschließen"
        />
        <UCheckbox v-model="includeLockers" label="Locker einschließen" />
        <UCheckbox
          v-model="includeBuffer"
          label="Access-Buffer berücksichtigen"
        />
      </div>
    </UCard>

    <UCard class="mb-6">
      <template #header>
        <div>
          <h2 class="text-xl font-semibold">Buchungen für Access-Point</h2>
          <p class="text-sm text-neutral-500">
            Zeigt die eigenen Buchungen, die einen bestimmten Access-Point
            berechtigen (Workflow B).
          </p>
        </div>
      </template>

      <form
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
        @submit.prevent="loadBookingsForAccessPoint"
      >
        <UFormField label="Access-Point ID" class="flex-1">
          <UInput
            v-model="accessPointIdInput"
            placeholder="z.B. ap-1"
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          icon="i-lucide-search"
          label="Buchungen suchen"
          :loading="loadingKey === 'ap-bookings'"
          :disabled="!accessPointIdInput.trim()"
        />
      </form>
    </UCard>

    <UAlert
      v-if="errorMessage"
      class="mb-6"
      color="error"
      icon="i-lucide-triangle-alert"
      title="API-Fehler"
      :description="errorMessage"
    />

    <UCard v-if="bookings.length === 0" class="text-center">
      <UIcon
        name="i-lucide-key-round"
        class="mx-auto mb-3 size-10 text-neutral-400"
      />
      <h2 class="text-lg font-semibold">Noch keine Buchungen geladen</h2>
      <p class="mt-1 text-sm text-neutral-500">
        Nutze den Button oben, um testweise die Access-Bookings API aufzurufen.
      </p>
    </UCard>

    <div class="space-y-4">
      <UCard v-for="booking in bookings" :key="booking.id">
        <template #header>
          <div
            class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h2 class="text-lg font-semibold">Buchung {{ booking.id }}</h2>
              <p class="text-sm text-neutral-500">
                Tenant: {{ booking.tenantId }} · Status:
                {{ booking.state || bookingStateLabel(booking) }}
              </p>
              <p class="text-sm text-neutral-500">
                {{ formatDate(booking.timeBegin) }} bis
                {{ formatDate(booking.timeEnd) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton
                color="neutral"
                variant="soft"
                :loading="loadingKey === `points:${booking.id}`"
                label="Access-Points laden"
                @click="loadAccessPoints(booking)"
              />
              <UButton
                color="neutral"
                variant="outline"
                label="JSON anzeigen"
                @click="toggleJson(`booking:${booking.id}`)"
              />
            </div>
          </div>
        </template>

        <pre
          v-if="visibleJson[`booking:${booking.id}`]"
          class="mb-4 overflow-auto rounded-md bg-neutral-100 p-3 text-xs dark:bg-neutral-900"
          >{{ pretty(booking) }}</pre
        >

        <div
          v-if="booking.accessPointIds?.length"
          class="mb-4 text-sm text-neutral-500"
        >
          Access-Point IDs: {{ booking.accessPointIds.join(", ") }}
        </div>

        <div
          v-if="accessPointsForBooking(booking).length"
          class="grid gap-4 md:grid-cols-2"
        >
          <UCard
            v-for="accessPoint in accessPointsForBooking(booking)"
            :key="accessPoint.id"
            variant="subtle"
          >
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="font-semibold">
                    {{ accessPoint.label || accessPoint.id }}
                  </h3>
                  <p class="text-sm text-neutral-500">
                    {{ accessPoint.type }} · {{ accessPoint.provider }} ·
                    {{ accessPoint.mode || "kein Modus" }}
                  </p>
                  <p class="text-xs text-neutral-500">
                    Bedienbar: {{ formatDate(accessPoint.accessFrom) }} bis
                    {{ formatDate(accessPoint.accessTo) }}
                  </p>
                </div>
                <UBadge
                  :color="canOperate(accessPoint) ? 'success' : 'neutral'"
                  variant="soft"
                >
                  {{ canOperate(accessPoint) ? "bedienbar" : "gesperrt" }}
                </UBadge>
              </div>
            </template>

            <div class="flex flex-wrap gap-2">
              <UButton
                label="Open"
                :disabled="!canOperate(accessPoint)"
                :loading="
                  loadingKey === actionKey('open', booking, accessPoint)
                "
                @click="runAction('open', booking, accessPoint)"
              />
              <UButton
                label="Unlatch"
                color="neutral"
                variant="soft"
                :disabled="!canOperate(accessPoint)"
                :loading="
                  loadingKey === actionKey('unlatch', booking, accessPoint)
                "
                @click="runAction('unlatch', booking, accessPoint)"
              />
              <UButton
                label="Close"
                color="neutral"
                variant="soft"
                :disabled="!canOperate(accessPoint)"
                :loading="
                  loadingKey === actionKey('close', booking, accessPoint)
                "
                @click="runAction('close', booking, accessPoint)"
              />
              <UButton
                label="Status"
                color="neutral"
                variant="outline"
                :loading="
                  loadingKey === actionKey('status', booking, accessPoint)
                "
                @click="runAction('status', booking, accessPoint)"
              />
              <UButton
                label="Open-Status pollen"
                color="neutral"
                variant="outline"
                :disabled="!openProcessIds[processKey(booking, accessPoint)]"
                :loading="
                  loadingKey === actionKey('poll', booking, accessPoint)
                "
                @click="runAction('poll', booking, accessPoint)"
              />
            </div>

            <pre
              v-if="responses[processKey(booking, accessPoint)]"
              class="mt-4 overflow-auto rounded-md bg-neutral-100 p-3 text-xs dark:bg-neutral-900"
              >{{ pretty(responses[processKey(booking, accessPoint)]) }}</pre
            >
          </UCard>
        </div>
      </UCard>
    </div>

    <UCard v-if="lastResponse" class="mt-6">
      <template #header>
        <h2 class="text-lg font-semibold">Letzte API-Antwort</h2>
      </template>
      <pre
        class="overflow-auto rounded-md bg-neutral-100 p-3 text-xs dark:bg-neutral-900"
        >{{ pretty(lastResponse) }}</pre
      >
    </UCard>
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

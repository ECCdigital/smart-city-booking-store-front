<template>
  <!-- no bookings available -->
  <UCard v-if="bookings.length === 0">
    <div class="flex flex-col items-center justify-center py-10">
      <UIcon
        name="i-lucide-calendar-off"
        class="w-12 h-12 text-neutral-400 mb-3"
      />
      <p class="text-sm text-neutral-500">Keine Schlüssel gefunden</p>
    </div>
  </UCard>

  <!-- else -->
  <UCard v-for="booking in bookings" :key="booking.id">
    <template #header>
      <!-- Status -->
      <div class="flex justify-end">
        <div
          class="flex px-3 py-1 rounded-full text-xs font-medium w-max"
          :class="bookingStatus(booking).color"
        >
          <UIcon
            :name="bookingStatus(booking).icon"
            class="w-4 h-4 mr-1 mt-0.5"
          />
          {{ bookingStatus(booking).label }}
        </div>
      </div>
      <!-- Title and Tenant -->
      <div class="flex gap-3 items-center">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10"
        >
          <UIcon name="i-lucide-key" class="w-5 h-5 text-primary font-bold" />
        </div>

        <div class="basis-6/7">
          <h2
            class="font-semibold line-clamp-2"
            :class="booking.leadBookable?.title.length > 40 ? '' : 'text-lg'"
          >
            {{ booking.leadBookable?.title || "Unbekanntes Buchungsobjekt" }}
          </h2>
          <p class="text-sm text-neutral-500">
            #{{ booking.id }} &middot; Tenant:
            {{ getTenantName(booking.tenantId) }}
          </p>
        </div>
      </div>

      <!-- Time and Address -->
      <div class="mt-5 flex flex-col lg:flex-row gap-3 lg:gap-5">
        <div class="lg:basis-auto flex flex-col sm:flex-row gap-3 lg:gap-5">
          <div
            class="basis-full sm:basis-1/2 lg:basis-auto flex items-center order-1"
          >
            <UIcon
              name="i-lucide-calendar"
              class="basis-1/10 sm:basis-auto w-4 h-4 m-0.5 mr-2"
            />
            <p class="text-sm text-neutral-500 whitespace-nowrap">
              {{ getTimeRange(booking.timeBegin, booking.timeEnd) }}
            </p>
          </div>
          <div class="w-full flex items-center order-2 lg:order-3">
            <UIcon
              name="i-lucide-map-pin-house"
              class="basis-1/10 sm:basis-auto w-4 h-4 m-0.5 mr-2"
            />
            <p class="text-sm text-neutral-500 lg:whitespace-nowrap">
              {{
                booking.leadBookable.location.display_address ||
                "Keine Adresse angegeben"
              }}
            </p>
          </div>
          <div
            v-if="booking.accessPoints.some((ap) => ap.type === 'door')"
            class="basis-full sm:basis-1/2 lg:basis-auto flex items-center order-3 lg:order-4"
          >
            <UIcon
              name="i-lucide-door-closed"
              class="basis-1/10 sm:basis-auto w-4 h-4 m-0.5 mr-2"
            />
            <p class="text-sm text-neutral-500 whitespace-nowrap">
              {{
                booking.accessPoints.filter((ap) => ap.type === "door").length
              }}
              {{
                booking.accessPoints.filter((ap) => ap.type === "door")
                  .length === 1
                  ? "Tür"
                  : "Türen"
              }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <pre
      class="text-xs bg-pink-50 border border-pink-200 rounded-md p-3 overflow-auto"
      >{{ JSON.stringify(booking.accessPoints, null, 2) }}</pre
    >

    <div v-for="accessPoint in booking.accessPoints" :key="accessPoint.id">
      <div class="flex items-center gap-2 my-2">
        <AccessPointLabel
          :access-point="accessPoint"
          :is-open="
            accessPointStatuses[`${booking.id}-${accessPoint.id}`]?.open
          "
          :is-locked="
            accessPointStatuses[`${booking.id}-${accessPoint.id}`]?.locked
          "
          show-mode
        />

        <div class="flex-1" />
        <AccessPointPanel
          :access-point="accessPoint"
          :booking-id="booking.id"
          :deny-access="!canOperate(accessPoint, booking)"
          @closed="loadStatus(booking.tenantId, accessPoint.id, booking.id)"
        />
      </div>
      <USeparator
        v-if="
          booking.accessPoints[booking.accessPoints.length - 1]?.id !==
          accessPoint.id
        "
        color="primary"
        type="solid"
        size="xs"
        class="w-full my-1"
      />
    </div>
  </UCard>
</template>
<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";
import AccessPointLabel from "~/components/mobileKey/AccessPointLabel.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import AccessPointPanel from "~/components/mobileKey/AccessPointPanel.vue";

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
});

const { getTenantName } = useTenant();
const { formatDate } = useFormatting();
const { getStatus } = useAccessPoints();

const bookingStatus = (booking) => {
  const now = Date.now();

  if (booking.timeBegin && now < booking.timeBegin) {
    return {
      label: "Kommend",
      color: "bg-yellow-100 text-yellow-800",
      icon: "i-lucide-clock",
    };
  }

  if (booking.timeEnd && now > booking.timeEnd) {
    return {
      label: "Vergangen",
      color: "bg-gray-100 text-gray-800",
      icon: "i-lucide-clock",
    };
  }

  return {
    label: "Aktiv",
    color: "bg-green-100 text-green-800",
    icon: "i-lucide-check",
  };
};

const accessPointStatuses = ref({});
const loadStatus = async (tenantId, accessPointId, bookingId) => {
  const key = `${bookingId}-${accessPointId}`;

  const response = await getStatus(tenantId, accessPointId, bookingId);

  accessPointStatuses.value[key] = response.success ? response.data : null;
};
const loadAllStatuses = async () => {
  const requests = [];

  for (const booking of props.bookings) {
    for (const accessPoint of booking.accessPoints) {
      requests.push(loadStatus(booking.tenantId, accessPoint.id, booking.id));
    }
  }

  await Promise.all(requests);
};

onMounted(loadAllStatuses);

const canOperate = (accessPoint, booking) => {
  if (!accessPoint.accessFrom || !accessPoint.accessTo) {
    if (booking.timeBegin && booking.timeEnd) {
      const now = Date.now();
      return now >= booking.timeBegin && now <= booking.timeEnd;
    }
    return true;
  }

  const now = Date.now();
  return now >= accessPoint.accessFrom && now <= accessPoint.accessTo;
};

function getTimeRange(startTimestamp, endTimestamp) {
  const begin = new Date(startTimestamp);
  const end = new Date(endTimestamp);
  const sameDay =
    begin.getFullYear() === end.getFullYear() &&
    begin.getMonth() === end.getMonth() &&
    begin.getDate() === end.getDate();

  const dateFmt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (sameDay) {
    return `${dateFmt.format(begin)}, ${timeFmt.format(begin)}-${timeFmt.format(end)}`;
  }

  return `${formatDate(begin)} - ${formatDate(end)}`;
}
</script>
<style scoped></style>

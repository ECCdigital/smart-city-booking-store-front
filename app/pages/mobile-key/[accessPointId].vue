<template>
  <div class="w-full mb-10">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader
        :title="accessPointLabel"
        :description="accessPointDescription"
        class="mb-3 md:mb-0"
      />
    </div>

    <div v-if="loading" class="space-y-3">
      <USkeleton class="h-20 w-full rounded-lg" />
    </div>
    <UAlert
      v-else-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Buchungen konnten nicht geladen werden"
      :description="errorMessage"
    />

    <!-- No Active Access Points -->
    <div
      v-else-if="bookingStatusFeedback && matchStatus !== 'active'"
      class="mb-12"
    >
      <UAlert
        :color="bookingStatusFeedback.color"
        variant="subtle"
        :icon="bookingStatusFeedback.icon"
        :title="bookingStatusFeedback.title"
        :description="bookingStatusFeedback.description"
        :ui="{
          icon: 'mt-0.5 md:mt-1',
        }"
      />
      <div class="flex items-center justify-center">
        <UButton
          variant="solid"
          class="flex justify-center py-3 shadow-lg cursor-pointer w-full md:w-48 my-3"
          to="/mobile-key"
        >
          Zur Schlüsselliste
        </UButton>
      </div>
    </div>

    <!-- Open Active Access Points -->
    <UCard
      v-if="matchStatus === 'active' && accessPoint"
      class="w-full md:w-[60%] rounded-lg mb-5"
    >
      <AccessPointLoadingSpinner v-if="isStatusLoading" class="my-10" />
      <div v-else>
        <AccessPointPanelContentHeader
          :access-point="accessPoint"
          :access-point-status="accessPointStatus"
          disable-close-button
        />
        <USeparator class="my-5" />
        <AccessPointPanelContentBody
          v-model="isVerified"
          :access-point="accessPoint"
          :access-point-status="accessPointStatus"
          :booking-id="bookingId"
          disable-help-section
          @status-updated="loadStatus"
          @close="onCloseDialog"
        />
      </div>
    </UCard>

    <ProviderHelpSection
      v-if="accessPoint && bookingId"
      :provider-id="accessPoint.provider"
      :tenant-id="accessPoint.tenant"
      :booking-id="bookingId"
      class="mb-12"
    />
  </div>
</template>

<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import AccessPointPanelContentBody from "~/components/mobileKey/AccessPointPanelContentBody.vue";
import AccessPointPanelContentHeader from "~/components/mobileKey/AccessPointPanelContentHeader.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";

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

const ACTIVE_BUFFER_MS = 15 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const { getAccessBookings, getStatus } = useAccessPoints();
const { formatDate } = useFormatting();

const route = useRoute();
const accessPointId = computed(() => String(route.params.accessPointId));

const loading = ref(true);
const errorMessage = ref("");

const matchedBooking = ref(null);
const matchStatus = ref("none");

const isStatusLoading = ref(false);
const isVerified = ref(false);
const accessPointStatus = ref({});

const responsePayload = (response) => response?.data ?? response;

const accessPoint = computed(() => {
  if (matchStatus.value !== "active" || !matchedBooking.value) {
    return null;
  }
  return (
    matchedBooking.value.accessPoints?.find(
      (point) => String(point.id) === accessPointId.value,
    ) ?? null
  );
});
const accessPointLabel = computed(() => {
  if (accessPoint.value && accessPoint.value.provider === "ifbs") {
    return "Schlüssel zur Fahrradbox #" + accessPoint.value.externalBookingId;
  } else if (accessPoint.value) {
    return "Schlüssel für " + accessPoint.value.label;
  }
  return "Digitaler Schlüssel";
});
const accessPointDescription = computed(() => {
  let textBlocks;
  if (accessPoint.value && accessPoint.value.provider === "ifbs") {
    textBlocks = ["Fahrradboxen", ""];
  } else if (accessPoint.value) {
    textBlocks = ["Türen", " und schließen"];
  } else {
    textBlocks = ["Schließanlagen", ""];
  }
  return (
    "Im Zeitraum Ihrer Buchung können Sie mit Ihrem digitalen Schlüssel " +
    textBlocks[0] +
    " öffnen" +
    textBlocks[1] +
    "."
  );
});

const bookingId = computed(() => String(matchedBooking.value?.id ?? ""));

const bookingHasAccessPoint = (booking, id) =>
  Array.isArray(booking.accessPoints) &&
  booking.accessPoints.some((point) => String(point.id) === id);

const classifyBooking = (booking, now) => {
  const timeBegin = booking.timeBegin;
  const timeEnd = booking.timeEnd;
  if (!timeBegin || !timeEnd) {
    return null;
  }
  const activeFrom = timeBegin - ACTIVE_BUFFER_MS;
  const activeTo = timeEnd + ACTIVE_BUFFER_MS;

  if (now >= activeFrom && now <= activeTo) {
    return "active";
  }
  if (now < activeFrom && timeBegin <= now + DAY_MS) {
    return "upcoming";
  }
  if (now > activeTo && timeEnd >= now - DAY_MS) {
    return "past";
  }
  return null;
};

const statusPriority = {
  active: 0,
  upcoming: 1,
  past: 2,
};
const pickBestMatch = (bookings, id) => {
  const now = Date.now();
  const candidates = [];
  for (const booking of bookings) {
    if (!bookingHasAccessPoint(booking, id)) {
      continue;
    }
    const status = classifyBooking(booking, now);
    if (!status) {
      continue;
    }
    candidates.push({ booking, status });
  }
  if (!candidates.length) {
    return { booking: null, status: "none" };
  }
  candidates.sort((a, b) => {
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    if (a.status === "upcoming") {
      return (a.booking.timeBegin ?? 0) - (b.booking.timeBegin ?? 0);
    }
    if (a.status === "past") {
      return (b.booking.timeEnd ?? 0) - (a.booking.timeEnd ?? 0);
    }
    return (b.booking.timeBegin ?? 0) - (a.booking.timeBegin ?? 0);
  });
  return candidates[0];
};
const bookingStatusFeedback = computed(() => {
  if (loading.value || errorMessage.value) {
    return null;
  }

  const booking = matchedBooking.value;
  switch (matchStatus.value) {
    case "upcoming":
      return {
        color: "warning",
        icon: "i-lucide-clock",
        title: "Buchung noch nicht gestartet",
        description: booking?.timeBegin
          ? `Ihre Buchung für diesen Zugangspunkt beginnt am ${formatDate(booking.timeBegin)}.`
          : "Ihre Buchung für diesen Zugangspunkt hat noch nicht begonnen.",
      };
    case "past":
      return {
        color: "neutral",
        icon: "i-lucide-history",
        title: "Buchung bereits beendet",
        description: booking?.timeEnd
          ? `Ihre Buchung für diesen Zugangspunkt ist am ${formatDate(booking.timeEnd)} abgelaufen.`
          : "Ihre Buchung für diesen Zugangspunkt ist bereits abgelaufen.",
      };
    case "none":
    default:
      return {
        color: "error",
        icon: "i-lucide-circle-x",
        title: "Keine passende Buchung",
        description:
          "In den letzten und kommenden 24 Stunden wurde keine Buchung mit dieser Zugangspunkt-ID gefunden.",
      };
  }
});
const loadBookingStatus = async () => {
  loading.value = true;
  errorMessage.value = "";
  matchedBooking.value = null;
  matchStatus.value = "none";
  accessPointStatus.value = {};
  isVerified.value = false;
  try {
    const response = await getAccessBookings({
      filter: "all",
      includeAccessPoints: "true",
      includeLockers: "true",
      includeBuffer: "true",
      includeEligibility: "true",
    });
    const bookings = responsePayload(response) || [];
    const match = pickBestMatch(bookings, accessPointId.value);
    matchedBooking.value = match.booking;
    matchStatus.value = match.status;

    if (match.status === "active") {
      await loadStatus();
    }
  } catch (error) {
    errorMessage.value =
      error?.statusMessage || error?.message || "Unbekannter API-Fehler";
  } finally {
    loading.value = false;
  }
};

async function loadStatus() {
  if (!accessPoint.value || !bookingId.value) {
    accessPointStatus.value = {};
    return;
  }
  isStatusLoading.value = true;
  try {
    const tenant = accessPoint.value.tenant || matchedBooking.value?.tenantId;
    const response = await getStatus(
      tenant,
      accessPoint.value.id,
      bookingId.value,
    );
    accessPointStatus.value = response.success ? response.data : {};
  } catch (error) {
    console.error("Error fetching access point status:", error);
    accessPointStatus.value = {};
  } finally {
    isStatusLoading.value = false;
  }
}
function onCloseDialog() {
  isVerified.value = false;
  navigateTo("/mobile-key");
}
watch(accessPointId, () => {
  loadBookingStatus();
});
onMounted(() => {
  loadBookingStatus();
});
</script>

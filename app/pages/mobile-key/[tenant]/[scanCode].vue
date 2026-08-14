<template>
  <div class="w-full max-w-xl mx-auto mb-10">
    <PageHeader
      title="Tür öffnen"
      description="Sie haben den Code an der Tür gescannt."
      class="mb-5"
    />

    <!--
      The door, once known. On the way to the flow only - inside it, the flow
      puts the card above its own stages.
    -->
    <AccessPointCard
      v-if="accessPoint && stage !== 'flow'"
      :access-point="accessPoint"
      :booking="booking"
      class="mb-5"
    />

    <!-- resolving the sticker and the matching booking -->
    <div v-if="stage === 'loading'" class="py-10">
      <AccessPointLoadingSpinner />
      <p class="text-center text-neutral-500 mt-4">
        Ihre Buchungen werden geprüft …
      </p>
    </div>

    <!-- more than one booking is active right now -->
    <div v-else-if="stage === 'select'" class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold">Welche Buchung?</h2>
        <p class="text-sm text-neutral-500">
          Mehrere Ihrer Buchungen passen gerade zu dieser Tür.
        </p>
      </div>
      <UButton
        v-for="candidate in candidates"
        :key="candidate.id"
        variant="outline"
        block
        class="justify-start py-3 cursor-pointer"
        @click="chooseBooking(candidate)"
      >
        <div class="text-left">
          <div class="font-semibold">
            {{ bookingTimeRange(candidate) }}
          </div>
          <div class="text-sm text-neutral-500">
            {{ candidate.leadBookable?.title || `Buchung #${candidate.id}` }}
          </div>
        </div>
      </UButton>
    </div>

    <!--
      From here on the page runs the very same flow as the panel: status,
      proof, open, close - the scan from the URL travels in as the evidence.
    -->
    <AccessPointOpenFlow
      v-else-if="stage === 'flow'"
      :tenant-id="tenantId"
      :access-point="accessPoint"
      :booking="booking"
      :evidence="scanEvidence"
    >
      <template #exit>
        <UButton variant="ghost" block to="/mobile-key" class="cursor-pointer">
          Zur Schlüsselliste
        </UButton>
      </template>
    </AccessPointOpenFlow>

    <!--
      The sticker or the booking did not work out; the door was never reached.
      None of these cases carries a `retry` of its own - what failed here is the
      resolution, and repeating it means starting over, whichever half it was.
    -->
    <div v-else class="space-y-5">
      <AccessPointErrorScreen
        :kind="errorKind"
        :access-point-label="accessPointLabel"
        :booking="booking"
        :tenant-id="tenantId"
        :blocking-reason="blockingReason"
        @retry="start"
      />

      <ProviderHelpSection
        v-if="showProviderHelp"
        :provider-id="accessPoint.provider"
        :tenant-id="tenantId"
        :booking-id="String(booking.id)"
      />

      <UButton variant="ghost" block to="/mobile-key" class="cursor-pointer">
        Zur Schlüsselliste
      </UButton>
    </div>
  </div>
</template>

<script setup>
import AccessPointCard from "~/components/mobileKey/AccessPointCard.vue";
import AccessPointErrorScreen from "~/components/mobileKey/AccessPointErrorScreen.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import AccessPointOpenFlow from "~/components/mobileKey/AccessPointOpenFlow.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { ACCESS_ERROR_SCREENS } from "~/utils/accessErrorScreens.js";
import {
  ACCESS_ERRORS,
  decideBookingOutcome,
  readAccessPoint,
  readScanResolution,
} from "~/utils/accessOpenFlow.js";

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

const route = useRoute();
const { resolveScan, getBookingsForAccessPoint } = useAccessPoints();
const { formatDateRange } = useFormatting();

const tenantId = computed(() => String(route.params.tenant));
const scanCode = computed(() => String(route.params.scanCode));

/**
 * What this page decides on its own: resolving the sticker and the booking
 * behind it (#18). `flow` is where it hands over to the shared flow, which
 * carries every stage from there to an open door.
 */
const stage = ref("loading");
const errorKind = ref(ACCESS_ERRORS.GENERIC);
const blockingReason = ref(null);

const accessPoint = ref(null);
const booking = ref(null);
const candidates = ref([]);

/**
 * The door by the name the sticker resolved to, kept apart from the door
 * itself: the payload can be refused while its label is perfectly good, and
 * that is the case where the error screen needs a name most.
 */
const scannedLabel = ref(null);

const responsePayload = (response) => response?.data ?? response;

const BOOKING_QUERY = {
  includeAccessPoints: "true",
  includeBuffer: "true",
};

function fail(kind, reason = null) {
  errorKind.value = kind;
  blockingReason.value = reason;
  stage.value = "error";
}

/**
 * Resolves the scanned sticker, then the booking behind it. A code that is no
 * longer current is reported here, on load - not only once someone taps open.
 */
async function start() {
  stage.value = "loading";
  accessPoint.value = null;
  scannedLabel.value = null;
  booking.value = null;
  candidates.value = [];

  try {
    const resolution = readScanResolution(
      await resolveScan(tenantId.value, scanCode.value),
    );

    if (resolution.error) {
      fail(resolution.error);
      return;
    }

    scannedLabel.value = resolution.accessPoint.label ?? null;
    accessPoint.value = readAccessPoint(resolution.accessPoint);

    // A door that does not say what it demands, or what it can do, is not
    // opened on a guess - and the sticker is named all the same.
    if (!accessPoint.value) {
      fail(ACCESS_ERRORS.GENERIC);
      return;
    }

    await resolveBooking();
  } catch (error) {
    console.error("Scan konnte nicht aufgelöst werden:", error);
    fail(ACCESS_ERRORS.GENERIC);
  }
}

/**
 * Asks for the bookings that are active for this door right now. Only when
 * none is, the wider list is fetched as well - it is what tells "too early"
 * apart from "too late" and from "no booking at all".
 */
async function resolveBooking() {
  const active =
    responsePayload(
      await getBookingsForAccessPoint(accessPoint.value.id, {
        ...BOOKING_QUERY,
        filter: "active",
        includeEligibility: "true",
      }),
    ) || [];

  const context = {
    accessPointId: accessPoint.value.id,
    tenantId: tenantId.value,
    activeBookings: active,
    otherBookings: [],
    now: Date.now(),
  };

  let outcome = decideBookingOutcome(context);

  if (outcome.error === ACCESS_ERRORS.NO_BOOKING) {
    context.otherBookings =
      responsePayload(
        await getBookingsForAccessPoint(accessPoint.value.id, {
          ...BOOKING_QUERY,
          filter: "all",
          // Eligibility here is not about opening - it is what keeps unpaid
          // bookings in the answer, so someone who has one is told when it
          // starts instead of "no booking".
          includeEligibility: "true",
        }),
      ) || [];
    outcome = decideBookingOutcome(context);
  }

  applyOutcome(outcome);
}

function applyOutcome(outcome) {
  booking.value = outcome.booking ?? null;

  if (outcome.screen === "ready") {
    stage.value = "flow";
    return;
  }
  if (outcome.screen === "select") {
    candidates.value = outcome.bookings;
    stage.value = "select";
    return;
  }

  fail(outcome.error, outcome.blockingReason);
}

function chooseBooking(candidate) {
  booking.value = candidate;
  stage.value = "flow";
}

/**
 * The sticker was read at the door, so the scan *is* the proof of presence -
 * which is why this page never shows the evidence stage (#3).
 */
const scanEvidence = computed(() => [
  { type: "qrScan", scanCode: scanCode.value },
]);

const bookingTimeRange = (candidate) =>
  formatDateRange(candidate?.timeBegin, candidate?.timeEnd) ||
  `Buchung #${candidate?.id}`;

/**
 * The door by name - the wording never says "the door", it says which one.
 * Until the sticker resolves there is no name to say.
 */
const accessPointLabel = computed(() => scannedLabel.value || "Der Zugang");

/** Which failures the provider's help can speak to is the case's own trait. */
const showProviderHelp = computed(
  () =>
    stage.value === "error" &&
    Boolean(accessPoint.value?.provider) &&
    Boolean(booking.value?.id) &&
    Boolean(ACCESS_ERROR_SCREENS[errorKind.value]?.help),
);

watch([tenantId, scanCode], () => {
  start();
});

onMounted(() => {
  start();
});
</script>

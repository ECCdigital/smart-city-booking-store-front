<template>
  <div class="w-full max-w-xl mx-auto mb-10">
    <PageHeader
      title="Tür öffnen"
      description="Sie haben den Code an der Tür gescannt."
      class="mb-5"
    />

    <!-- the door, once known: one card above the stages, not one per stage -->
    <AccessPointCard
      v-if="accessPoint"
      :access-point="accessPoint"
      :booking="booking"
      :is-open="stage === 'opened'"
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

    <!-- ready: opening happens on an explicit tap, never automatically -->
    <div v-else-if="stage === 'ready'" class="space-y-5">
      <AccessPointStatusScreen
        icon="i-lucide-key-round"
        color="neutral"
        title="Bereit zum Öffnen"
        description="Ihre Buchung ist aktiv. Der Scan gilt als Nachweis, dass Sie vor der Tür stehen."
      />
      <UButton
        size="xl"
        block
        icon="i-lucide-lock-open"
        class="py-4 shadow-lg cursor-pointer"
        @click="openDoor"
      >
        Tür öffnen
      </UButton>
    </div>

    <!-- the open request is on its way -->
    <div v-else-if="stage === 'opening'" class="py-10">
      <AccessPointLoadingSpinner />
      <p class="text-center text-neutral-500 mt-4">Tür wird geöffnet …</p>
    </div>

    <!-- opened -->
    <div v-else-if="stage === 'opened'" class="space-y-5">
      <AccessPointStatusScreen
        icon="i-lucide-unlock"
        color="success"
        :title="t('mobileKey.stages.opened.title')"
        :description="
          t('mobileKey.stages.opened.description', { label: accessPointLabel })
        "
      />
      <UButton
        variant="outline"
        block
        class="py-3 cursor-pointer"
        @click="openDoor"
      >
        {{ t("mobileKey.actions.open_again") }}
      </UButton>
      <UButton variant="ghost" block to="/mobile-key" class="cursor-pointer">
        Zur Schlüsselliste
      </UButton>
    </div>

    <!-- everything that did not work out -->
    <div v-else class="space-y-5">
      <AccessPointErrorScreen
        :kind="errorKind"
        :access-point-label="accessPointLabel"
        :booking="booking"
        :tenant-id="tenantId"
        :blocking-reason="blockingReason"
        @retry="retryFailure"
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
import AccessPointStatusScreen from "~/components/mobileKey/AccessPointStatusScreen.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { ACCESS_ERROR_SCREENS } from "~/utils/accessErrorScreens.js";
import {
  ACCESS_ERRORS,
  buildOpenRequest,
  decideBookingOutcome,
  readOpenConfirmation,
  readOpenOutcome,
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
const { resolveScan, getBookingsForAccessPoint, open, pollOpenStatus } =
  useAccessPoints();
const { formatDateRange } = useFormatting();
const { t } = useI18n();

const tenantId = computed(() => String(route.params.tenant));
const scanCode = computed(() => String(route.params.scanCode));

const stage = ref("loading");
const errorKind = ref(ACCESS_ERRORS.GENERIC);
const blockingReason = ref(null);

const accessPoint = ref(null);
const booking = ref(null);
const candidates = ref([]);

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

    accessPoint.value = resolution.accessPoint;
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
    stage.value = "ready";
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
  stage.value = "ready";
}

/**
 * The tap on the button is the intent: the scan travels along as evidence and
 * `channel` records for the audit that this open came from a QR scan.
 */
async function openDoor() {
  if (!accessPoint.value || !booking.value) {
    fail(ACCESS_ERRORS.GENERIC);
    return;
  }

  stage.value = "opening";

  try {
    const outcome = readOpenOutcome(
      await open(
        tenantId.value,
        accessPoint.value.id,
        String(booking.value.id),
        buildOpenRequest({
          evidence: [{ type: "qrScan", scanCode: scanCode.value }],
        }),
      ),
      { booking: booking.value, now: Date.now() },
    );

    if (outcome.pendingProcessId) {
      await confirmOpen(outcome.pendingProcessId);
      return;
    }

    if (outcome.opened) {
      stage.value = "opened";
      return;
    }

    fail(outcome.error, outcome.blockingReason);
  } catch (error) {
    console.error("Tür konnte nicht geöffnet werden:", error);
    fail(ACCESS_ERRORS.DOOR_UNREACHABLE);
  }
}

/**
 * Some providers only acknowledge the open and report the outcome later. The
 * success screen waits for that confirmation rather than assuming it.
 */
async function confirmOpen(openProcessId) {
  const confirmation = readOpenConfirmation(
    await pollOpenStatus(
      tenantId.value,
      accessPoint.value.id,
      String(booking.value.id),
      openProcessId,
    ),
  );

  if (confirmation.opened) {
    stage.value = "opened";
    return;
  }

  fail(confirmation.error);
}

/**
 * The way out of a failure says what to repeat: `"action"` runs the open
 * again, `"status"` only re-reads. Never the other way round - a second open
 * command can latch an open door shut again. Reading the door's own status
 * arrives with the shared flow; until then re-reading means starting over.
 */
function retryFailure(repeat) {
  if (repeat === "status") {
    start();
    return;
  }

  openDoor();
}

const bookingTimeRange = (candidate) =>
  formatDateRange(candidate?.timeBegin, candidate?.timeEnd) ||
  `Buchung #${candidate?.id}`;

/**
 * The door by name - the wording never says "the door", it says which one.
 * Until the sticker resolves there is no name to say.
 */
const accessPointLabel = computed(
  () => accessPoint.value?.label || "Der Zugang",
);

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

<template>
  <div class="w-full max-w-xl mx-auto mb-10">
    <PageHeader
      :title="wording.title"
      :description="wording.description"
      class="mb-5"
    />

    <!--
      The door, once known - and it stays once the flow takes over, because the
      flow no longer carries it. Each host names the door in the shape it has
      room for: the panel one line in its header, this page the full card, the
      page having no 60vh to fit the stage into.
    -->
    <AccessPointCard
      v-if="accessPoint"
      :access-point="accessPoint"
      :booking="booking"
      :is-open="isOpen"
      class="mb-5"
    />

    <!-- resolving the sticker and the matching booking -->
    <div v-if="stage === 'loading'" class="py-10">
      <AccessPointLoadingSpinner />
      <p class="text-center text-neutral-500 mt-4">
        {{ $t("mobileKey.checkingBookings") }}
      </p>
    </div>

    <!-- more than one booking is active right now -->
    <div v-else-if="stage === 'select'" class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{{ $t("mobileKey.whichBooking") }}</h2>
        <p class="text-sm text-neutral-500">
          {{ wording.severalBookingsMatch }}
        </p>
      </div>
      <UButton
        v-for="candidate in candidates"
        :key="candidate.id"
        variant="outline"
        block
        class="justify-start py-3"
        @click="chooseBooking(candidate)"
      >
        <div class="text-left">
          <div class="font-semibold">
            {{ bookingTimeRange(candidate) }}
          </div>
          <div class="text-sm text-neutral-500">
            {{
              candidate.leadBookable?.title ||
              t("mobileKey.bookingNumber", { id: candidate.id })
            }}
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
      @status="(next) => (status = next)"
    >
      <template #exit>
        <UButton variant="ghost" block to="/mobile-key">
          {{ $t("mobileKey.toKeyList") }}
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
        :access-point-id="namedPoint?.id ?? accessPoint?.id ?? null"
        :compartments="ownCompartments"
        @retry="start"
      />

      <SupportContactLine
        :provider-id="accessPoint?.provider ?? null"
        :access-point="accessPoint"
        :tenant-id="tenantId"
        :booking="booking"
        expanded
      />

      <UButton variant="ghost" block to="/mobile-key">
        {{ $t("mobileKey.toKeyList") }}
      </UButton>
    </div>
  </div>
</template>

<script setup>
import AccessPointCard from "~/components/mobileKey/AccessPointCard.vue";
import AccessPointErrorScreen from "~/components/mobileKey/AccessPointErrorScreen.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import AccessPointOpenFlow from "~/components/mobileKey/AccessPointOpenFlow.vue";
import SupportContactLine from "~/components/mobileKey/SupportContactLine.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import {
  ACCESS_ERRORS,
  decideBookingOutcome,
  isUnlocked,
  readAccessPoint,
  readScanResolution,
  scanBookingLookup,
} from "~/utils/accessOpenFlow.js";
import { accessPointName, scanPageWording } from "~/utils/accessPointDisplay.js";

definePageMeta({
  requiresAuth: true,
  layout: "panel",
  navigation: "user",
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.mobileKey"));

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
 * At a Fach the outcome may name the person's own instead of the scanned
 * one: the Fach whose window "not yet" or "over" speaks of (`namedPoint`),
 * or every Fach of the Anlage they hold, for „Nicht Ihr Fach“
 * (`ownCompartments`).
 */
const namedPoint = ref(null);
const ownCompartments = ref([]);

/**
 * The last status the flow reported. The card stands above the flow now rather
 * than only on the way to it, so it has to follow the door instead of claiming
 * "locked" for as long as the page is open - the very thing ticket 06 took out
 * of the key list. Read with `isUnlocked`, like the list row and the panel.
 */
const status = ref(undefined);
const isOpen = computed(() => isUnlocked(status.value) === true);

/**
 * The door as the sticker resolved to it, kept apart from the door itself:
 * the payload can be refused while its name is perfectly good, and that is
 * the case where the error screen needs a name most.
 */
const scannedPoint = ref(null);

/** Door or Fach: the frame of the page says which one was scanned. */
const wording = computed(() => scanPageWording(scannedPoint.value, t));

const responsePayload = (response) => response?.data ?? response;

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
  scannedPoint.value = null;
  booking.value = null;
  candidates.value = [];
  namedPoint.value = null;
  ownCompartments.value = [];
  status.value = undefined;

  try {
    const resolution = readScanResolution(
      await resolveScan(tenantId.value, scanCode.value),
    );

    if (resolution.error) {
      fail(resolution.error);
      return;
    }

    scannedPoint.value = resolution.accessPoint;
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
 * apart from "too late" and from "no booking at all". A Fach is asked for at
 * its Anlage (`scanBookingLookup`), both times, and compared by its own id.
 */
async function resolveBooking() {
  const lookup = scanBookingLookup(accessPoint.value);
  const active =
    responsePayload(
      await getBookingsForAccessPoint(lookup.accessPointId, {
        ...lookup.query,
        filter: "active",
        includeEligibility: "true",
      }),
    ) || [];

  const context = {
    accessPointId: accessPoint.value.id,
    lockerSystemId: accessPoint.value.lockerSystemId ?? null,
    tenantId: tenantId.value,
    activeBookings: active,
    otherBookings: [],
    now: Date.now(),
  };

  let outcome = decideBookingOutcome(context);

  if (outcome.error === ACCESS_ERRORS.NO_BOOKING) {
    context.otherBookings =
      responsePayload(
        await getBookingsForAccessPoint(lookup.accessPointId, {
          ...lookup.query,
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
  namedPoint.value = outcome.accessPoint ?? null;
  ownCompartments.value = outcome.compartments ?? [];

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
  t("mobileKey.bookingNumber", { id: candidate?.id });

/**
 * The door by name - the wording never says "the door", it says which one;
 * a Fach by Anlage, Schrank and number - the person's own where the outcome
 * names it. Until the sticker resolves there is no name to say.
 */
const accessPointLabel = computed(() =>
  accessPointName(namedPoint.value ?? scannedPoint.value, t),
);

watch([tenantId, scanCode], () => {
  start();
});

onMounted(() => {
  start();
});
</script>

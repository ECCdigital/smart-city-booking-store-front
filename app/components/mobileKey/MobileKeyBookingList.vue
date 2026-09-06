<template>
  <!-- still loading -->
  <template v-if="loading">
    <USkeleton
      v-for="i in SKELETON_CARDS"
      :key="i"
      class="h-64 w-full rounded-lg"
    />
  </template>

  <!-- the fetch failed, which is not the same as having nothing -->
  <UCard v-else-if="error">
    <div class="flex flex-col items-center justify-center py-10 text-center">
      <UIcon
        name="i-lucide-cloud-alert"
        class="w-12 h-12 text-error mb-3"
      />
      <p class="text-sm text-neutral-500">
        Ihre Schlüssel konnten nicht geladen werden.
      </p>
      <p class="text-xs text-neutral-400 mt-1">{{ error }}</p>
    </div>
  </UCard>

  <!-- no bookings available -->
  <UCard v-else-if="bookings.length === 0">
    <div class="flex flex-col items-center justify-center py-10">
      <UIcon
        name="i-lucide-calendar-off"
        class="w-12 h-12 text-neutral-400 mb-3"
      />
      <p class="text-sm text-neutral-500">Keine Schlüssel gefunden</p>
    </div>
  </UCard>

  <!-- else -->
  <template v-else>
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

      <div v-for="accessPoint in booking.accessPoints" :key="accessPoint.id">
        <div class="flex items-center gap-2 my-2">
          <div
            class="flex shrink-0 items-center justify-center rounded-lg w-8 h-8"
            :class="lockState(accessPoint, booking).background"
            :title="lockState(accessPoint, booking).label"
          >
            <UIcon
              :name="lockState(accessPoint, booking).icon"
              class="w-5 h-5 font-bold"
              :class="lockState(accessPoint, booking).color"
            />
          </div>

          <div class="lg:flex lg:gap-2 lg:items-center basis-6/7">
            <div class="text-md font-semibold line-clamp-2">
              {{ accessPointTitle(accessPoint) }}
            </div>
            <div class="text-sm text-neutral-500">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                :class="accessPointMode(accessPoint).color"
              >
                <UIcon
                  :name="accessPointMode(accessPoint).icon"
                  class="w-3.5 h-3.5"
                />
                {{ accessPointMode(accessPoint).label }}
              </span>
            </div>
          </div>

          <div class="flex-1" />
          <!--
            The flow reports every status it learns; there is nothing left to
            ask the server for once the panel closes.
          -->
          <AccessPointPanel
            :tenant-id="String(booking.tenantId)"
            :access-point="accessPoint"
            :booking="booking"
            :deny-access="!canOperate(accessPoint, booking)"
            @status="
              (status) =>
                (accessPointStatuses[statusKey(booking.id, accessPoint.id)] =
                  status)
            "
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
</template>
<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import AccessPointPanel from "~/components/mobileKey/AccessPointPanel.vue";
import { readStatus } from "~/utils/accessOpenFlow.js";
import {
  accessPointLock,
  accessPointMode,
  accessPointTitle,
} from "~/utils/accessPointDisplay.js";

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
  /**
   * Whether the bookings are still on their way. It travels as a prop rather
   * than being decided here, because the fetch happens in the page - but the
   * empty state lives in this template, and the two are answers to the same
   * question. Split across two files, one could say "loading" while the other
   * said "nothing there", which is how "Keine Schlüssel gefunden" came to be
   * the first thing the page said on every visit.
   */
  loading: {
    type: Boolean,
    default: false,
  },
  /** A fetch that failed, so that it can say so instead of passing for empty. */
  error: {
    type: String,
    default: "",
  },
});

/**
 * Enough to read as a list rather than as one thing, and few enough that they
 * do not promise a longer list than usually arrives.
 */
const SKELETON_CARDS = 2;

const { getTenantName } = useTenant();
const { formatDate } = useFormatting();
const { getStatus } = useAccessPoints();

/**
 * The badge on a booking, in as many words as a badge holds. The full
 * sentences for the same reasons live in `de.json`
 * (`mobileKey.blocking_reasons`) and belong to the error screen; a badge with
 * a whole sentence in it is not an option, so the two stay apart and the list
 * stays outside the translation keys.
 */
const blockingReasonLabels = Object.freeze({
  rejected: "Abgelehnt",
  not_committed: "Noch nicht bestätigt",
  payment_required: "Zahlung ausstehend",
  authorization_revoked: "Berechtigung widerrufen",
  outside_access_window: "Außerhalb des Zeitfensters",
  not_provisioned: "Noch nicht freigegeben",
  no_remote_access: "Keine Fernsteuerung",
  evidence_missing: "Nachweis fehlt",
  evidence_invalid: "Nachweis ungültig",
  evidence_rule_unavailable: "Zugang nicht prüfbar",
});

const bookingStatus = (booking) => {
  const now = Date.now();
  const eligibility = booking.accessEligibility;

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

  if (
    eligibility &&
    !eligibility.canOperate &&
    eligibility.primaryBlockingReason &&
    eligibility.primaryBlockingReason !== "outside_access_window"
  ) {
    return {
      label:
        blockingReasonLabels[eligibility.primaryBlockingReason] ||
        "Nicht verfügbar",
      color: "bg-orange-100 text-orange-800",
      icon: "i-lucide-lock",
    };
  }

  return {
    label: "Aktiv",
    color: "bg-green-100 text-green-800",
    icon: "i-lucide-check",
  };
};

const accessPointStatuses = ref({});

/** The one place the key of that map is spelled - it is built in three. */
const statusKey = (bookingId, accessPointId) => `${bookingId}-${accessPointId}`;

/**
 * Read the same way the flow reads it, so both writers of this map put the
 * same four fields in it and no provider-owned key survives in half of them.
 */
const loadStatus = async (tenantId, accessPointId, bookingId) => {
  accessPointStatuses.value[statusKey(bookingId, accessPointId)] = readStatus(
    await getStatus(tenantId, accessPointId, bookingId),
  );
};
/**
 * Asks only the doors that can answer, as the flow does (`refreshStatus`): a
 * locker at rest declares no `getStatus` and would return four nulls for the
 * request. One door's refusal is its own affair - the others keep the answers
 * they got, which is why the requests are settled rather than raced.
 */
const loadAllStatuses = async () => {
  const requests = [];

  for (const booking of props.bookings) {
    for (const accessPoint of booking.accessPoints) {
      if (!accessPoint.capabilities?.includes("getStatus")) {
        continue;
      }

      requests.push(loadStatus(booking.tenantId, accessPoint.id, booking.id));
    }
  }

  await Promise.allSettled(requests);
};

onMounted(loadAllStatuses);

/**
 * The mount above finds an empty list: the page fetches its bookings after
 * mounting this, and every later filter fetches again. Without this, no door
 * was ever asked - which the old two-state symbol hid by drawing a padlock for
 * an answer it never got.
 */
watch(() => props.bookings, loadAllStatuses);

/**
 * How this door's lock is drawn. A key missing from the map is a door nobody
 * has asked about, which `accessPointLock` tells apart from an answer - the
 * `?.open === true` this replaces could not, and read both as "closed".
 */
const lockState = (accessPoint, booking) =>
  accessPointLock(
    accessPointStatuses.value[statusKey(booking.id, accessPoint.id)],
  );

/**
 * The server-side eligibility is the authority (#18). A second, hand-rolled
 * sum in the client can only ever disagree with it - so where the server
 * names no operable access point, none is operable.
 */
const canOperate = (accessPoint, booking) =>
  booking.accessEligibility?.operableAccessPointIds?.includes(
    String(accessPoint.id),
  ) ?? false;

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

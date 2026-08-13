<template>
  <div class="space-y-5">
    <ScanStatusScreen
      :icon="screen.icon"
      :color="screen.color"
      :title="screen.title"
      :description="screen.description"
    />

    <UButton
      v-if="screen.retry"
      block
      icon="i-lucide-refresh-cw"
      class="py-3 shadow-lg cursor-pointer"
      @click="emit('retry')"
    >
      Erneut versuchen
    </UButton>
    <UButton
      v-else-if="screen.cta"
      block
      :to="screen.cta.to"
      class="py-3 shadow-lg cursor-pointer"
    >
      {{ screen.cta.label }}
    </UButton>
  </div>
</template>

<script setup>
import ScanStatusScreen from "~/components/mobileKey/ScanStatusScreen.vue";
import { formatBlockingReasonMessage } from "~/composables/utils/useAccessBlockingReasons.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { ACCESS_ERRORS } from "~/utils/accessOpenFlow.js";

const props = defineProps({
  /** An {@link ACCESS_ERRORS} value. */
  kind: {
    type: String,
    required: true,
  },
  /** The booking the failure is about, where there is one. */
  booking: {
    type: Object,
    default: null,
  },
  /** Tenant from the scanned URL - the CTAs stay inside it. */
  tenantId: {
    type: String,
    required: true,
  },
  /** The server's own reason, shown when no screen speaks for it. */
  blockingReason: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["retry"]);

const { formatDate } = useFormatting();

const bookablesPath = computed(() => `/t/${props.tenantId}/bookables`);

const rebookPath = computed(() => {
  const leadBookableId = props.booking?.leadBookable?.id;
  return leadBookableId
    ? `/t/${props.tenantId}/bookables/${leadBookableId}`
    : bookablesPath.value;
});

/**
 * The wording and the way out for every failure the scan flow can end on. A
 * reason without an entry of its own falls through to the generic screen,
 * which still names the reason rather than pretending nothing happened.
 */
const screens = computed(() => ({
  [ACCESS_ERRORS.STALE_SCAN_CODE]: {
    icon: "i-lucide-tag",
    color: "warning",
    title: "Aufkleber veraltet",
    description:
      "Dieser QR-Code wurde ersetzt und ist nicht mehr gültig. Bitte informieren Sie die Verwaltung, damit der Aufkleber an der Tür erneuert wird.",
  },
  [ACCESS_ERRORS.UNKNOWN_SCAN_CODE]: {
    icon: "i-lucide-circle-help",
    color: "error",
    title: "Code unbekannt",
    description:
      "Dieser QR-Code gehört zu keiner Tür dieses Mandanten. Möglicherweise ist der Link unvollständig.",
  },
  [ACCESS_ERRORS.NO_BOOKING]: {
    icon: "i-lucide-search-x",
    color: "error",
    title: "Keine passende Buchung",
    description:
      "Für Sie wurde keine Buchung gefunden, die zu dieser Tür gehört.",
    cta: { label: "Jetzt buchen", to: bookablesPath.value },
  },
  [ACCESS_ERRORS.PAYMENT_REQUIRED]: {
    icon: "i-lucide-credit-card",
    color: "error",
    title: "Buchung noch nicht bezahlt",
    description:
      "Erst nach Zahlungseingang lässt sich die Tür mit dieser Buchung öffnen.",
    cta: {
      label: "Jetzt bezahlen",
      to: `/account/bookings/${props.booking?.id}`,
    },
  },
  [ACCESS_ERRORS.TOO_EARLY]: {
    icon: "i-lucide-hourglass",
    color: "warning",
    title: "Noch nicht so weit",
    description: props.booking?.timeBegin
      ? `Ihre Buchung beginnt am ${formatDate(props.booking.timeBegin)}. Ab dann können Sie die Tür hier öffnen.`
      : "Ihre Buchung hat noch nicht begonnen.",
  },
  [ACCESS_ERRORS.TOO_LATE]: {
    icon: "i-lucide-moon",
    color: "neutral",
    title: "Buchung beendet",
    description:
      "Ihre Buchung ist bereits abgelaufen. Die Tür lässt sich damit nicht mehr öffnen.",
    cta: { label: "Erneut buchen", to: rebookPath.value },
  },
  [ACCESS_ERRORS.DOOR_UNREACHABLE]: {
    icon: "i-lucide-antenna",
    color: "error",
    title: "Tür nicht erreichbar",
    description:
      "Das Schloss antwortet gerade nicht. Das kann an der Verbindung vor Ort liegen.",
    retry: true,
  },
  [ACCESS_ERRORS.EVIDENCE_RULE_UNAVAILABLE]: {
    icon: "i-lucide-wrench",
    color: "error",
    title: "Öffnen zurzeit nicht möglich",
    description:
      "Diese Tür ist fehlerhaft konfiguriert. Bitte kontaktieren Sie die Verwaltung – Ihre Buchung bleibt gültig.",
  },
  [ACCESS_ERRORS.EVIDENCE_INVALID]: {
    icon: "i-lucide-tag",
    color: "warning",
    title: "Aufkleber prüfen",
    description:
      "Der gescannte Code gehört nicht mehr zu dieser Tür. Bitte prüfen Sie den Aufkleber und informieren Sie die Verwaltung.",
  },
  [ACCESS_ERRORS.EVIDENCE_MISSING]: {
    icon: "i-lucide-scan-line",
    color: "warning",
    title: "Vor Ort scannen",
    description:
      "Diese Tür lässt sich nur öffnen, wenn Sie den QR-Code direkt an der Tür scannen.",
  },
  [ACCESS_ERRORS.GENERIC]: {
    icon: "i-lucide-triangle-alert",
    color: "error",
    title: "Öffnen nicht möglich",
    description: formatBlockingReasonMessage(
      props.blockingReason ? [props.blockingReason] : [],
      "Die Tür konnte nicht geöffnet werden. Bitte versuchen Sie es später erneut.",
    ),
  },
}));

const screen = computed(
  () => screens.value[props.kind] || screens.value[ACCESS_ERRORS.GENERIC],
);
</script>

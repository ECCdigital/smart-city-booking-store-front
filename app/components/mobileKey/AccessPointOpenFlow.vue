<template>
  <div class="space-y-5">
    <!-- the door, once above the stages - not once per stage -->
    <AccessPointCard
      :access-point="accessPoint"
      :booking="booking"
      :is-open="isOpen"
    />

    <AccessPointStepper
      v-if="stepper.length > 1"
      :steps="stepper"
      :current-step="view.currentStep"
    />

    <!-- one chain, one axis: the nine stages of accessOpenFlow -->
    <div v-if="view.stage === 'loading'" class="py-10">
      <AccessPointLoadingSpinner />
      <p class="text-center text-neutral-500 mt-4">
        {{ t("mobileKey.stages.loading.title") }}
      </p>
    </div>

    <!--
      U08 hands the evidence stage the old verify component, fake timeout and
      all. U09 puts the real scanner here.
    -->
    <AccessPointVerifyLocation
      v-else-if="view.stage === 'evidence'"
      v-model:verified="evidenceCollectedHere"
      :access-point="accessPoint"
      :booking-id="bookingId"
    />

    <div v-else-if="view.stage === 'can_open'" class="py-10">
      <AccessPointControlButton
        variant="open"
        :title="
          evidenceCollectedHere
            ? t('mobileKey.stages.can_open.evidence_confirmed')
            : ''
        "
        :access-point-label="accessPointLabel"
        @open="openDoor"
      />
    </div>

    <div v-else-if="view.stage === 'can_close'" class="py-10">
      <AccessPointControlButton
        variant="close"
        :title="
          t('mobileKey.stages.can_close.title', { label: accessPointLabel })
        "
        :access-point-label="accessPointLabel"
        @lock="closeDoor"
      />
    </div>

    <div
      v-else-if="view.stage === 'opening' || view.stage === 'closing'"
      class="py-10"
    >
      <AccessPointLoadingSpinner />
      <p class="text-center text-neutral-500 mt-4">
        {{
          t(`mobileKey.stages.${view.stage}.title`, { label: accessPointLabel })
        }}
      </p>
    </div>

    <!-- the result belongs in the flow: opening again is a way on, not a way out -->
    <div v-else-if="view.stage === 'opened'" class="space-y-5">
      <AccessPointStatusScreen
        icon="i-lucide-unlock"
        color="success"
        :title="t('mobileKey.stages.opened.title')"
        :description="
          t('mobileKey.stages.opened.description', { label: accessPointLabel })
        "
      />
      <UButton
        v-if="canClose"
        block
        icon="i-lucide-lock"
        class="py-3 shadow-lg cursor-pointer"
        @click="closeDoor"
      >
        {{ t("mobileKey.actions.close_now") }}
      </UButton>
      <UButton
        variant="outline"
        block
        class="py-3 cursor-pointer"
        @click="openDoor"
      >
        {{ t("mobileKey.actions.open_again") }}
      </UButton>
    </div>

    <div v-else-if="view.stage === 'closed'" class="space-y-5">
      <AccessPointStatusScreen
        icon="i-lucide-lock"
        color="success"
        :title="t('mobileKey.stages.closed.title')"
        :description="
          t('mobileKey.stages.closed.description', { label: accessPointLabel })
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
    </div>

    <div v-else class="space-y-5">
      <AccessPointErrorScreen
        :kind="view.error ?? ACCESS_ERRORS.GENERIC"
        :access-point-label="accessPointLabel"
        :booking="booking"
        :tenant-id="tenantId"
        :blocking-reason="view.blockingReason"
        @retry="retryFailure"
      />

      <ProviderHelpSection
        v-if="showProviderHelp"
        :provider-id="accessPoint.provider"
        :tenant-id="tenantId"
        :booking-id="bookingId"
      />
    </div>

    <!-- the way out of the context, rendered by whoever put the flow here -->
    <slot name="exit" :stage="view.stage" :status="status" />
  </div>
</template>

<script setup>
/**
 * The whole opening of a door, from both ways to one: the key list opens it in
 * a panel, the scan landing page renders it straight into the page. It reads
 * the status, collects the proof where one is demanded, calls `open`, polls,
 * calls `close` - and reports nothing but results.
 *
 * Which stage the person in front of the door sees is not decided here: that is
 * `decideStage` in `~/utils/accessOpenFlow.js`, tested without a browser. What
 * stays here is the order of the awaits, the timing of the poll, one emit and
 * one slot.
 */
import AccessPointCard from "~/components/mobileKey/AccessPointCard.vue";
import AccessPointControlButton from "~/components/mobileKey/AccessPointControlButton.vue";
import AccessPointErrorScreen from "~/components/mobileKey/AccessPointErrorScreen.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import AccessPointStatusScreen from "~/components/mobileKey/AccessPointStatusScreen.vue";
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import AccessPointVerifyLocation from "~/components/mobileKey/AccessPointVerifyLocation.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { ACCESS_ERROR_SCREENS } from "~/utils/accessErrorScreens.js";
import {
  ACCESS_ERRORS,
  buildOpenRequest,
  decideStage,
  readCloseOutcome,
  readOpenConfirmation,
  readOpenOutcome,
  readStatus,
} from "~/utils/accessOpenFlow.js";

const props = defineProps({
  /** Always explicit, never read off the access point (#21). */
  tenantId: {
    type: String,
    required: true,
  },
  /** As `readAccessPoint()` left it - the caller normalises before handing it in. */
  accessPoint: {
    type: Object,
    required: true,
  },
  /** Resolved, not an id: "too early" and "too late" need its times. */
  booking: {
    type: Object,
    required: true,
  },
  /** Proof already in hand - the scan page passes what the URL carried (#3). */
  evidence: {
    type: Array,
    default: () => [],
  },
});

/** The only thing this flow says outwards: the status it just learned. */
const emit = defineEmits(["status"]);

const { open, close, getStatus, pollOpenStatus } = useAccessPoints();
const { t } = useI18n();

/** `undefined` while nobody has read one, `null` when there was none to read. */
const status = ref(undefined);
const action = ref(null);
const result = ref(null);

/**
 * What failed, for the retry that follows: by the time the error screen stands,
 * the action is over and `action` is back to `null`.
 */
const lastAction = ref(null);

/**
 * Whether the proof was collected in *this* session - the one thing about
 * evidence that is the component's business and not `decideStage`'s. It is
 * what puts "proof provided" on the button, and it stays false where the proof
 * came from the URL or where none was demanded.
 */
const evidenceCollectedHere = ref(false);

const bookingId = computed(() => String(props.booking.id));
const accessPointLabel = computed(() => props.accessPoint.label || "Der Zugang");

/**
 * What the old verify component hands up in place of a scan. U08 is a
 * transition: that component announces a proof it never collected, and this is
 * the shape of the announcement. U09 replaces it with the scanner's real
 * `[{ type: "qrScan", scanCode }]`, and this constant goes with the fake.
 */
const PRETENDED_SCAN = Object.freeze([{ type: "qrScan" }]);

/**
 * The proof in hand, wherever it came from - the scan URL (#3) or the evidence
 * stage. `decideStage` is told the fact and never the origin (§ 4.5 a); which
 * of the two it was stays with `evidenceCollectedHere`, for the button alone.
 *
 * The pretended scan may move the stage on - that is exactly what the list way
 * does today - but it never reaches the wire: the open request is built from
 * `props.evidence`, which is empty on the list way, so the command goes out
 * without evidence and the server refuses it as it does today.
 */
const evidenceInHand = computed(() =>
  evidenceCollectedHere.value && !props.evidence.length
    ? PRETENDED_SCAN
    : props.evidence,
);

const view = computed(() =>
  decideStage({
    status: status.value,
    evidence: evidenceInHand.value,
    validationRuleTypes: props.accessPoint.validationRuleTypes,
    capabilities: props.accessPoint.capabilities,
    action: action.value,
    result: result.value,
    booking: props.booking,
  }),
);

const canClose = computed(() =>
  props.accessPoint.capabilities.includes("close"),
);

/** The card's icon follows the stage, so card and stage read the door alike. */
const isOpen = computed(() =>
  ["can_close", "opened"].includes(view.value.stage),
);

/** Which failures the provider's help can speak to is the case's own trait. */
const showProviderHelp = computed(
  () =>
    view.value.stage === "error" &&
    Boolean(props.accessPoint.provider) &&
    Boolean(props.booking?.id) &&
    Boolean(ACCESS_ERROR_SCREENS[view.value.error]?.help),
);

/**
 * The stepper belongs to the way, not to the result: once the door has
 * answered, there is no step left to be on. A single step hides itself.
 */
const STEPPED_STAGES = Object.freeze([
  "loading",
  "evidence",
  "can_open",
  "opening",
]);
const STEP_WORDING = Object.freeze({
  verify: "step_verify",
  open: "step_open",
});

const stepper = computed(() =>
  STEPPED_STAGES.includes(view.value.stage)
    ? view.value.steps.map((step) => ({
        value: step,
        label: t(`mobileKey.evidence.${STEP_WORDING[step]}`),
        description: "",
      }))
    : [],
);

function applyStatus(next) {
  status.value = next;
  emit("status", next);
}

/**
 * Reads the door's own state. A door that cannot report one is not asked -
 * `decideStage` then skips the spinner rather than waiting for an answer that
 * will never come.
 */
async function refreshStatus() {
  if (!props.accessPoint.capabilities.includes("getStatus")) {
    return;
  }

  try {
    applyStatus(
      readStatus(
        await getStatus(props.tenantId, props.accessPoint.id, bookingId.value),
      ),
    );
  } catch (error) {
    console.error("Status konnte nicht geladen werden:", error);
    applyStatus(null);
  }
}

/**
 * The tap is the intent: the proof travels along and `channel` records for the
 * audit that a QR scan stands behind the open. A provider that only
 * acknowledges the command is waited for - `pendingProcessId` is not an open
 * door.
 */
async function openDoor() {
  action.value = "open";
  lastAction.value = "open";
  result.value = null;

  try {
    const outcome = readOpenOutcome(
      await open(
        props.tenantId,
        props.accessPoint.id,
        bookingId.value,
        buildOpenRequest({ evidence: props.evidence }),
      ),
      { booking: props.booking },
    );

    result.value = outcome.pendingProcessId
      ? readOpenConfirmation(
          await pollOpenStatus(
            props.tenantId,
            props.accessPoint.id,
            bookingId.value,
            outcome.pendingProcessId,
          ),
        )
      : outcome;
  } catch (error) {
    console.error("Tür konnte nicht geöffnet werden:", error);
    result.value = { opened: false, error: ACCESS_ERRORS.DOOR_UNREACHABLE };
  } finally {
    action.value = null;
    await refreshStatus();
  }
}

async function closeDoor() {
  action.value = "close";
  lastAction.value = "close";
  result.value = null;

  // The close answer carries the state after closing - one roundtrip saved.
  let stateAfterClosing = null;

  try {
    const outcome = readCloseOutcome(
      await close(props.tenantId, props.accessPoint.id, bookingId.value),
    );
    result.value = outcome;
    stateAfterClosing = outcome.status;
  } catch (error) {
    console.error("Tür konnte nicht geschlossen werden:", error);
    result.value = { closed: false, error: ACCESS_ERRORS.CLOSE_FAILED };
  } finally {
    action.value = null;

    if (stateAfterClosing) {
      applyStatus(stateAfterClosing);
    } else {
      await refreshStatus();
    }
  }
}

/**
 * The way out of a failure says what to repeat: `"action"` runs the command
 * that failed again, `"status"` only re-reads the door. Never the other way
 * round - a second open command can latch an open door shut again.
 */
function retryFailure(repeat) {
  result.value = null;

  if (repeat === "status") {
    status.value = undefined;
    refreshStatus();
    return;
  }

  if (lastAction.value === "close") {
    closeDoor();
    return;
  }

  openDoor();
}

onMounted(refreshStatus);
</script>

<style scoped></style>

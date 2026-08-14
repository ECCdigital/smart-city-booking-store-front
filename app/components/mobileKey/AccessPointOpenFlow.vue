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

    <!-- the proof, collected where the person stands -->
    <AccessPointScanEvidence
      v-else-if="view.stage === 'evidence'"
      :tenant-id="tenantId"
      :access-point="accessPoint"
      @scanned="(evidence) => (evidenceCollectedHere = evidence)"
    />

    <div v-else-if="view.stage === 'can_open'" class="py-10">
      <AccessPointControlButton
        variant="open"
        :title="
          evidenceCollectedHere.length
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

    <!--
      A result is passed through, not lived in: it stands for a moment and then
      hands the stage back to the one control button, which by then points the
      other way. The stage itself has a second life, though - `opened` is where
      an open door rests when no provider can close it, and that one needs a
      way on of its own.
    -->
    <div v-else-if="view.stage === 'opened'" class="space-y-5">
      <AccessPointStatusScreen
        icon="i-lucide-unlock"
        color="success"
        :prominent="Boolean(result)"
        :title="t('mobileKey.stages.opened.title')"
        :description="
          t('mobileKey.stages.opened.description', { label: accessPointLabel })
        "
      />
      <div v-if="!result" class="pt-4">
        <AccessPointControlButton
          variant="open"
          :title="t('mobileKey.actions.open_again')"
          :access-point-label="accessPointLabel"
          @open="openDoor"
        />
      </div>
    </div>

    <AccessPointStatusScreen
      v-else-if="view.stage === 'closed'"
      icon="i-lucide-lock"
      color="success"
      prominent
      :title="t('mobileKey.stages.closed.title')"
      :description="
        t('mobileKey.stages.closed.description', { label: accessPointLabel })
      "
    />

    <AccessPointErrorScreen
      v-else
      :kind="view.error ?? ACCESS_ERRORS.GENERIC"
      :access-point-label="accessPointLabel"
      :booking="booking"
      :tenant-id="tenantId"
      :blocking-reason="view.blockingReason"
      @retry="retryFailure"
    />

    <!--
      What a passed failure leaves behind: its name, quietly, under the button
      that repeats it. The help sits with it rather than inside the error stage,
      because the offer is the same whether the screen still stands or has just
      gone.
    -->
    <p
      v-if="passedFailure"
      class="flex items-center justify-center gap-2 text-sm text-neutral-500"
    >
      <UIcon :name="passedFailure.icon" class="shrink-0" />
      <span>{{ passedFailure.title }}</span>
    </p>

    <ProviderHelpSection
      v-if="showProviderHelp"
      :provider-id="accessPoint.provider"
      :tenant-id="tenantId"
      :booking-id="bookingId"
    />

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
import AccessPointScanEvidence from "~/components/mobileKey/AccessPointScanEvidence.vue";
import AccessPointStatusScreen from "~/components/mobileKey/AccessPointStatusScreen.vue";
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import {
  ACCESS_ERROR_SCREENS,
  buildErrorScreen,
  failureMayPass,
} from "~/utils/accessErrorScreens.js";
import {
  ACCESS_ERRORS,
  buildCommandStatus,
  buildOpenRequest,
  decideStage,
  isUnlocked,
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
 * How long a result stands before it gives the button back. The only piece of
 * time in this flow, and it stays here: `decideStage` decides stages, never
 * durations (#7), which is why its nine stages and their tests are untouched
 * by any of this - `opened` is now entered briefly rather than lived in.
 */
const RESULT_VISIBLE_MS = 2500;

/**
 * How long the lock is given to finish turning before it is asked again.
 *
 * A status read the instant a command returns catches the lock mid-turn and
 * still reports the state it is coming from - the backend reads it that early
 * itself (`_readStatusAfterClose` in `access-service.js`, whose own comment
 * says "a lock takes its time to turn"), and so does `refreshStatus`. Nothing
 * in the payload tells a turning lock from an unknown one, because
 * `_resolveOpen` maps every state it does not know to `null`. So the flow
 * waits instead, and asks a second time.
 */
const STATUS_SETTLE_MS = 1200;

/** Timers still owed a callback, so an unmount can call them off. */
const pendingWaits = new Set();

/**
 * Bumped whenever an action starts or the component goes away. A pass in
 * flight compares against it after every await and drops out rather than
 * writing over whatever came after it.
 */
let passRun = 0;

/** Plain, not reactive: nothing renders from these two. */
let mounted = true;

/**
 * The failure whose screen has already passed, still named under the button
 * that repeats it - until the next action begins.
 */
const passedFailureKind = ref(null);

/**
 * The proof the scanner collected in *this* session - the one thing about
 * evidence that is the component's business and not `decideStage`'s. It is
 * what puts "proof provided" on the button, and it stays empty where the proof
 * came from the URL or where none was demanded.
 */
const evidenceCollectedHere = ref([]);

const bookingId = computed(() => String(props.booking.id));
const accessPointLabel = computed(() => props.accessPoint.label || "Der Zugang");

/**
 * The proof in hand, wherever it came from - the scan URL (#3) or the scanner
 * on the evidence stage. `decideStage` is told the fact and never the origin
 * (§ 4.5 a); which of the two it was stays with `evidenceCollectedHere`, for
 * the button alone.
 */
const evidenceInHand = computed(() => [
  ...props.evidence,
  ...evidenceCollectedHere.value,
]);

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

/** The card's icon follows the stage, so card and stage read the door alike. */
const isOpen = computed(() =>
  ["can_close", "opened"].includes(view.value.stage),
);

/**
 * The failure the person is looking at, whether it still fills the stage or
 * has passed and left its line behind. Both are the same failure to everything
 * that speaks about one.
 */
const failureInTheRoom = computed(() =>
  view.value.stage === "error" ? view.value.error : passedFailureKind.value,
);

/** Which failures the provider's help can speak to is the case's own trait. */
const showProviderHelp = computed(
  () =>
    Boolean(failureInTheRoom.value) &&
    Boolean(props.accessPoint.provider) &&
    Boolean(props.booking?.id) &&
    Boolean(ACCESS_ERROR_SCREENS[failureInTheRoom.value]?.help),
);

/** The passed failure by name and sign, in the table's own words. */
const passedFailure = computed(() =>
  passedFailureKind.value
    ? buildErrorScreen(passedFailureKind.value, {
        t,
        label: accessPointLabel.value,
      })
    : null,
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
        // What to do stands under the step that is due; the open step says it
        // on the button itself and needs no second line above it.
        description:
          step === "verify"
            ? t("mobileKey.evidence.hint", { label: accessPointLabel.value })
            : "",
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

/** A wait an unmount or a fresh action can call off. */
function wait(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(() => {
      pendingWaits.delete(id);
      resolve();
    }, ms);

    pendingWaits.add(id);
  });
}

/** Calls off everything a pass still has pending. */
function stopPass() {
  passRun += 1;
  pendingWaits.forEach(clearTimeout);
  pendingWaits.clear();
}

/** Every action starts on a clean slate: no old result, no old failure line. */
function beginAction(kind) {
  stopPass();
  action.value = kind;
  result.value = null;
  passedFailureKind.value = null;
}

/**
 * The command's own word about the door, put in place of a status that cannot
 * be had - or of one that contradicts it, which right after a command means a
 * lock caught mid-turn far more often than a door that disobeyed. It stands in
 * only until `confirmStatus` gets a reading the lock had time to make.
 */
function applyCommandStatus(nowOpen) {
  const unreadable = status.value === undefined || status.value === null;

  if (unreadable || isUnlocked(status.value) !== nowOpen) {
    applyStatus(buildCommandStatus({ open: nowOpen }));
  }
}

/**
 * The second look, once the lock has had time to finish turning - and the one
 * that decides. A door that did not move says so here, which is why this
 * reading outranks the command's word rather than merely confirming it.
 */
async function confirmStatus(nowOpen, ours) {
  await wait(STATUS_SETTLE_MS);
  if (!ours()) {
    return;
  }

  await refreshStatus();
  if (!ours()) {
    return;
  }

  // Still nothing readable: the command's word is all anyone has.
  if (status.value === undefined || status.value === null) {
    applyStatus(buildCommandStatus({ open: nowOpen }));
  }
}

/**
 * Lets the result stand for a moment and then hands the stage back to the
 * control button. A failure that may pass leaves its name behind (→
 * `failureMayPass`); one that may not is never timed and keeps its screen
 * until someone acts on it.
 *
 * The result never passes before the door has been asked a second time, so the
 * button that comes back is decided by the best reading there is - and that
 * wait costs nothing, because the result is on screen for it anyway.
 *
 * @param {boolean|null} nowOpen What the command established about the door;
 *   `null` where it established nothing, a failure being no news about a lock.
 */
async function letResultPass(nowOpen) {
  const failure = result.value?.error ?? null;

  // Whoever closed the panel mid-request is owed no timer: this runs after
  // awaits, so the unmount may already be behind us.
  if (!mounted || (failure && !failureMayPass(failure))) {
    return;
  }

  const run = ++passRun;
  const ours = () => mounted && run === passRun;

  await Promise.all([
    wait(RESULT_VISIBLE_MS),
    nowOpen === null ? Promise.resolve() : confirmStatus(nowOpen, ours),
  ]);

  if (!ours()) {
    return;
  }

  passedFailureKind.value = failure;
  result.value = null;
}

/**
 * The tap is the intent: the proof travels along and `channel` records for the
 * audit that a QR scan stands behind the open. A provider that only
 * acknowledges the command is waited for - `pendingProcessId` is not an open
 * door.
 */
async function openDoor() {
  beginAction("open");

  try {
    const outcome = readOpenOutcome(
      await open(
        props.tenantId,
        props.accessPoint.id,
        bookingId.value,
        buildOpenRequest({ evidence: evidenceInHand.value }),
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

    const opened = result.value?.opened === true;
    if (opened) {
      applyCommandStatus(true);
    }

    letResultPass(opened ? true : null);
  }
}

async function closeDoor() {
  beginAction("close");

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

    const closed = result.value?.closed === true;
    if (closed) {
      applyCommandStatus(false);
    }

    letResultPass(closed ? false : null);
  }
}

/**
 * The way out of a failure that stands: re-read the door, nothing else. The
 * other way out - run the failed command again - is no longer a button of its
 * own. Those cases carry `retry: "action"`, their screen passes, and the
 * control button they hand back *is* the repeat; so only `"status"` ever
 * reaches here. Which was always the safe half: a second open command can
 * latch an open door shut again.
 */
function retryFailure() {
  result.value = null;
  status.value = undefined;
  refreshStatus();
}

onMounted(refreshStatus);
onUnmounted(() => {
  mounted = false;
  stopPass();
});
</script>

<style scoped></style>

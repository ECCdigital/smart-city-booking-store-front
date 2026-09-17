<template>
  <div class="space-y-5">
    <!--
      The door is named by whoever put the flow here, not by the flow: the
      panel carries it in its header, the scan page in the card above. The rule
      it replaces - the door once above the stages, not once per stage - still
      holds; it is the host that now keeps it, and on a phone that buys the
      stage the 188 px the card was spending inside it.
    -->
    <AccessPointStepper
      v-if="stepper.length > 1"
      :steps="stepper"
      :current-step="view.currentStep"
    />

    <!--
      One chain, one axis: the nine stages of accessOpenFlow - and one frame
      around it, so the stage that is going can be lifted out of the flow while
      the one that comes already stands in place.
    -->
    <div class="relative">
      <!--
        The proof, collected where the person stands - and the only stage held
        outside the chain. A read sticker is answered by this very leave: the
        stage flips at once, and the square fades out green over the button
        that has already taken its place. The scanner cannot bring that leave
        itself, because it is not the one that removes it.
      -->
      <Transition name="scan-hit">
        <AccessPointScanEvidence
          v-if="view.stage === 'evidence'"
          :tenant-id="tenantId"
          :access-point="accessPoint"
          @scanned="(evidence) => (evidenceCollectedHere = evidence)"
        />
      </Transition>

      <div v-if="view.stage === 'loading'" class="py-10">
        <AccessPointLoadingSpinner />
        <p class="text-center text-neutral-500 mt-4">
          {{ t("mobileKey.stages.loading.title") }}
        </p>
      </div>

      <div v-else-if="view.stage === 'can_open'" class="py-10">
        <AccessPointControlButton
          variant="open"
          :title="
            evidenceCollectedHere.length
              ? t('mobileKey.stages.can_open.evidence_confirmed')
              : ''
          "
          :access-point-label="accessPointLabel"
          v-bind="buttonState"
          @open="openDoor"
          @refresh="readStatusOnHold"
        />
      </div>

      <div v-else-if="view.stage === 'can_close'" class="py-10">
        <AccessPointControlButton
          variant="close"
          :title="
            t('mobileKey.stages.can_close.title', { label: accessPointLabel })
          "
          :access-point-label="accessPointLabel"
          v-bind="buttonState"
          @lock="closeDoor"
          @refresh="readStatusOnHold"
        />
      </div>

      <div
        v-else-if="view.stage === 'opening' || view.stage === 'closing'"
        class="py-10"
      >
        <AccessPointLoadingSpinner />
        <p class="text-center text-neutral-500 mt-4">
          {{
            t(`mobileKey.stages.${view.stage}.title`, {
              label: accessPointLabel,
            })
          }}
        </p>
      </div>

      <!--
        A result is passed through, not lived in: it stands for a moment and
        then hands the stage back to the one control button, which by then
        points the other way. The stage itself has a second life, though -
        `opened` is where an open door rests when no provider can close it, and
        that one needs a way on of its own.
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
            v-bind="buttonState"
            @open="openDoor"
            @refresh="readStatusOnHold"
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

      <!--
        Still the chain's last word - it catches every stage the branches above
        did not name. Only the scanner is excepted, and only because it now
        hangs beside the chain rather than in it.
      -->
      <AccessPointErrorScreen
        v-else-if="view.stage !== 'evidence'"
        :kind="view.error ?? ACCESS_ERRORS.GENERIC"
        :access-point-label="accessPointLabel"
        :booking="booking"
        :tenant-id="tenantId"
        :blocking-reason="view.blockingReason"
        :access-point-id="accessPoint.id"
        @retry="retryFailure"
      />
    </div>

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

    <!--
      The Provider Support Contact, under every stage a person could need it -
      folded while the button works, open once a failure is in the room.
    -->
    <SupportContactLine
      v-if="view.stage !== 'loading' && view.stage !== 'evidence'"
      :provider-id="accessPoint.provider ?? null"
      :tenant-id="tenantId"
      :booking-id="bookingId"
      :expanded="supportContactExpanded"
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
import AccessPointControlButton from "~/components/mobileKey/AccessPointControlButton.vue";
import AccessPointErrorScreen from "~/components/mobileKey/AccessPointErrorScreen.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import AccessPointScanEvidence from "~/components/mobileKey/AccessPointScanEvidence.vue";
import AccessPointStatusScreen from "~/components/mobileKey/AccessPointStatusScreen.vue";
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import SupportContactLine from "~/components/mobileKey/SupportContactLine.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useAccessNow } from "~/composables/useAccessClock.js";
import {
  ACCESS_ERROR_SCREENS,
  buildErrorScreen,
  failureMayPass,
} from "~/utils/accessErrorScreens.js";
import {
  ACCESS_ERRORS,
  LOCK_BUSY_READ_MS,
  buildBusyResult,
  buildCommandStatus,
  buildOpenRequest,
  canReportStatus,
  commandConfirmed,
  concludeBurst,
  cooldownProgress,
  cooldownSecondsLeft,
  decideStage,
  isCooling,
  isLockBusy,
  planBurst,
  readCloseOutcome,
  startCooldown,
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

/**
 * The only thing this flow says outwards: the status it just learned - every
 * one it learns while it stands, and its last known one once more as it goes,
 * so the key row behind a closed sheet keeps what the sheet knew and has no
 * reason to read again.
 */
const emit = defineEmits(["status"]);

const { open, close, getStatus, pollOpenStatus } = useAccessPoints();
const { t } = useI18n();

/** `undefined` while nobody has read one, `null` when there was none to read. */
const status = ref(undefined);
const action = ref(null);
const result = ref(null);

/**
 * The Cooldown, a fact beside `status` and never a stage: the epoch ms until
 * which the button takes no command. `0` where none was ever started. Set by
 * every sent command, both directions, and set again from full on Lock Busy.
 */
const cooldownUntil = ref(0);

/**
 * Raised when the lock answered Lock Busy to the last command: the amber line
 * under the caption saying the wait starts over. It stands for the length of
 * the restarted Cooldown - it is only shown while cooling - and the next
 * action takes it down.
 */
const busyNotice = ref(false);

/**
 * The one plain read owed after Lock Busy, `null` outside one. Plain, not
 * reactive: nothing renders from it. A hold before it fires takes its place.
 * `busyReadDue` is its reactive shadow, for `settling` alone.
 */
let busyReadTimer = null;
const busyReadDue = ref(false);

/**
 * A status read in flight - the hold's or the Confirmation Burst's. The
 * button shows a spinner for it, and a hold that lands meanwhile is absorbed
 * by it rather than starting a second read.
 */
const reading = ref(false);

/**
 * The Confirmation Burst in flight, `null` outside one: the command it
 * confirms, the timers still owed a read (`timers`, so Lock Busy can call
 * them off and put its own single read in their place - S3) and the last
 * readable reading so far, the close answer's own status counted as read zero.
 * Plain, not reactive: nothing renders from it. `bursting` is its reactive
 * shadow, for `settling` alone.
 */
let burst = null;
const bursting = ref(false);

/**
 * The clock the Cooldown is read against. It only ticks while there is a
 * Cooldown to drain, so the flow at rest costs no timer.
 */
const now = ref(Date.now());
const COOLDOWN_TICK_MS = 100;
let cooldownTicker = null;

const cooling = computed(() => isCooling(cooldownUntil.value, now.value));

/**
 * The page's clock (`useAccessClock`), which moves at the door's window
 * boundaries; the stage reads the Access Window against it. Joined with the
 * Cooldown's own ticks, whichever is later - the two are never both moving,
 * and the later one is the truer `now`.
 */
const accessNow = useAccessNow();
const stageNow = computed(() => Math.max(accessNow.value, now.value));

/**
 * A command is still settling: its Cooldown, its Confirmation Burst or the
 * read owed after Lock Busy is running, or the command itself is in flight.
 * The window's end waits for it - the stage flips to `too_late` once the
 * last of them is done, never mid-command.
 */
const settling = computed(
  () =>
    cooling.value ||
    bursting.value ||
    busyReadDue.value ||
    action.value !== null,
);

/** What the button needs to draw the Cooldown and the running read. */
const buttonState = computed(() => ({
  cooling: cooling.value,
  cooldownSeconds: cooldownSecondsLeft(cooldownUntil.value, now.value),
  cooldownProgress: cooldownProgress(cooldownUntil.value, now.value),
  reading: reading.value,
  busyNotice: busyNotice.value && cooling.value,
}));

/**
 * How long a result stands before it gives the button back. The only piece of
 * time in this flow, and it stays here: `decideStage` decides stages, never
 * durations (#7), which is why its nine stages and their tests are untouched
 * by any of this - `opened` is now entered briefly rather than lived in.
 */
const RESULT_VISIBLE_MS = 2500;

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
    accessPointId: props.accessPoint.id,
    settling: settling.value,
    now: stageNow.value,
  }),
);

/**
 * The failure the person is looking at, whether it still fills the stage or
 * has passed and left its line behind. Both are the same failure to everything
 * that speaks about one.
 */
const failureInTheRoom = computed(() =>
  view.value.stage === "error" ? view.value.error : passedFailureKind.value,
);

/**
 * Which failures unfold the support contact is the case's own trait. The
 * contact itself stands under every stage; this only decides "expanded".
 */
const supportContactExpanded = computed(
  () =>
    Boolean(failureInTheRoom.value) &&
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
 * One read of the door's own state, applied by whoever asked for it. A door
 * that cannot report one is not asked - `decideStage` then skips the spinner
 * rather than waiting for an answer that will never come - and the answer is
 * `undefined`, as it is once the sheet has gone: a reading nobody can show is
 * not applied over whatever the row kept.
 *
 * @returns {Promise<ReturnType<typeof readStatus>|undefined>} `null` where
 *   the door had no readable status, `undefined` where it was not asked
 */
async function readDoor() {
  if (!canReportStatus(props.accessPoint)) {
    return undefined;
  }

  reading.value = true;
  let next = null;
  try {
    next = readStatus(
      await getStatus(props.tenantId, props.accessPoint.id, bookingId.value),
    );
  } catch (error) {
    console.error("Status konnte nicht geladen werden:", error);
  } finally {
    reading.value = false;
  }

  return mounted ? next : undefined;
}

/**
 * Reads the door and shows what it said - the mount, the retry and the hold.
 * Inside a Confirmation Burst the reading is the burst's as well: a match
 * ends it, anything else is one more reading for it to weigh at the end - and
 * only a readable one is shown meanwhile. An unreadable one changes nothing:
 * the command's word stands, no new screen (S2).
 *
 * @param {{ owedAfterBusy?: boolean }} [options] The read stands in for the
 *   one owed after Lock Busy: a failure is then ignored silently, as that
 *   read's would have been (S3)
 */
async function refreshStatus({ owedAfterBusy = false } = {}) {
  const next = await readDoor();
  if (owedAfterBusy) {
    busyReadDue.value = false;
  }
  if (next === undefined) {
    return;
  }

  if (burst) {
    absorbIntoBurst(next);
    if (next && burst) {
      applyStatus(next);
    }
    return;
  }
  if (next === null && owedAfterBusy) {
    return;
  }
  applyStatus(next);
}

/**
 * The hold on the Control Button: read the status, send nothing. Works at any
 * time, inside and outside the Cooldown. A read already running - the burst's
 * or another hold's - absorbs it: the button is showing that read's spinner,
 * and one answer is all it needs. Outside a running read the hold reads at
 * once, and the burst, if one is on, is neither restarted nor put off. The
 * read still owed after Lock Busy is another matter: the hold *is* that read,
 * and the scheduled one is called off - one read in total, with that read's
 * silence about a failure.
 */
function readStatusOnHold() {
  if (reading.value) {
    return;
  }
  const owedAfterBusy = busyReadTimer !== null;
  if (owedAfterBusy) {
    clearTimeout(busyReadTimer);
    busyReadTimer = null;
  }
  refreshStatus({ owedAfterBusy });
}

/**
 * Starts the Confirmation Burst for a command that was carried out: the
 * commanded state is shown at once, and the door is read at
 * `BURST_DELAYS_MS` until a reading confirms the command. A close answer's own
 * status is read zero - where it already confirms, it is shown and nothing is
 * scheduled. A door that cannot report its state keeps the command's word.
 *
 * @param {"open"|"close"} command
 * @param {ReturnType<typeof readStatus>|undefined} answerStatus The status
 *   that came with the command's answer, if any
 */
function startBurst(command, answerStatus) {
  stopBurst();

  const delays = planBurst(command, answerStatus);
  if (!delays.length) {
    applyStatus(answerStatus);
    return;
  }

  applyStatus(buildCommandStatus({ open: command === "open" }));
  if (!canReportStatus(props.accessPoint)) {
    return;
  }

  burst = { command, timers: [], lastReadable: answerStatus ?? null };
  bursting.value = true;
  for (const delay of delays) {
    const id = setTimeout(() => burstRead(id), delay);
    burst.timers.push(id);
  }
}

/** Calls off every read the burst still owes. */
function stopBurst() {
  if (burst) {
    burst.timers.forEach(clearTimeout);
    burst = null;
  }
  bursting.value = false;
}

/**
 * One scheduled read of the burst. A read already running - a hold's, or an
 * earlier burst read that is taking its time - absorbs it: that read's answer
 * is weighed for the burst in its place.
 */
async function burstRead(id) {
  const mine = burst;
  mine.timers = mine.timers.filter((timer) => timer !== id);

  if (reading.value) {
    return;
  }

  const next = await readDoor();
  if (burst !== mine || next === undefined) {
    return;
  }
  absorbIntoBurst(next);
}

/**
 * Weighs one reading for the burst. A reading that confirms the command ends
 * the burst; an unreadable one changes nothing. When the last read is in
 * without a match, the burst concludes: the last readable reading wins over
 * the command's word, and the button flips to it without a new screen.
 */
function absorbIntoBurst(next) {
  const mine = burst;

  if (next) {
    mine.lastReadable = next;
  }
  if (commandConfirmed(mine.command, next)) {
    stopBurst();
    applyStatus(next);
    return;
  }
  if (!mine.timers.length) {
    stopBurst();
    applyStatus(concludeBurst(mine.command, mine.lastReadable));
  }
}

/**
 * Starts the Cooldown from full and keeps the clock ticking until it has
 * drained. Called for every sent command, whatever its answer turns out to be:
 * the lock has the command either way and is busy with it.
 */
function beginCooldown() {
  cooldownUntil.value = startCooldown();
  now.value = Date.now();

  if (cooldownTicker !== null) {
    return;
  }
  cooldownTicker = setInterval(() => {
    now.value = Date.now();
    if (!isCooling(cooldownUntil.value, now.value)) {
      stopCooldownTicker();
    }
  }, COOLDOWN_TICK_MS);
}

function stopCooldownTicker() {
  if (cooldownTicker !== null) {
    clearInterval(cooldownTicker);
    cooldownTicker = null;
  }
}

/**
 * The lock took nothing: it was still busy with the action before. An
 * outcome, not an error - no screen, no toast, the stage as it was before the
 * tap. The Cooldown restarts from full (the answer came later than the tap,
 * so the first start is behind), the amber line goes up for its length, and
 * one plain read is scheduled so the sheet learns what the busy lock was
 * doing. No Confirmation Burst: there is no command to confirm.
 *
 * @param {"open"|"close"} command
 */
function settleLockBusy(command) {
  result.value = buildBusyResult(command);
  beginCooldown();
  busyNotice.value = true;

  stopBusyRead();
  if (canReportStatus(props.accessPoint)) {
    busyReadTimer = setTimeout(busyRead, LOCK_BUSY_READ_MS);
    busyReadDue.value = true;
  }
}

/**
 * The one read after Lock Busy, applied whatever it says. A read already
 * running - a hold's - absorbs it, as in the burst. A read that fails is
 * ignored silently: the status stays what it was, and nobody gets a
 * "status unavailable" screen for a read they never asked for.
 */
async function busyRead() {
  busyReadTimer = null;
  if (reading.value) {
    busyReadDue.value = false;
    return;
  }

  const next = await readDoor();
  busyReadDue.value = false;
  if (next) {
    applyStatus(next);
  }
}

/** Calls off the read still owed after Lock Busy, if one is. */
function stopBusyRead() {
  if (busyReadTimer !== null) {
    clearTimeout(busyReadTimer);
    busyReadTimer = null;
  }
  busyReadDue.value = false;
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

/**
 * Every action starts on a clean slate: no old result, no old failure line,
 * and no burst still confirming the command before it.
 */
function beginAction(kind) {
  stopPass();
  stopBurst();
  stopBusyRead();
  action.value = kind;
  result.value = null;
  passedFailureKind.value = null;
  busyNotice.value = false;
}

/**
 * Lets the result stand for a moment and then hands the stage back to the
 * control button. A failure that may pass leaves its name behind (→
 * `failureMayPass`); one that may not is never timed and keeps its screen
 * until someone acts on it.
 *
 * The button that comes back shows the commanded state; the Confirmation
 * Burst runs on beside it and flips it should the lock say otherwise.
 */
async function letResultPass() {
  const failure = result.value?.error ?? null;

  // Whoever closed the panel mid-request is owed no timer: this runs after
  // awaits, so the unmount may already be behind us.
  if (!mounted || (failure && !failureMayPass(failure))) {
    return;
  }

  const run = ++passRun;

  await wait(RESULT_VISIBLE_MS);
  if (!mounted || run !== passRun) {
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
  // The button shakes instead of emitting while cooling; this is the backstop.
  if (cooling.value) {
    return;
  }

  beginAction("open");
  beginCooldown();

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
    if (isLockBusy(error)) {
      settleLockBusy("open");
    } else {
      console.error("Door could not be opened:", error);
      result.value = { opened: false, error: ACCESS_ERRORS.DOOR_UNREACHABLE };
    }
  } finally {
    action.value = null;

    // No read the instant the answer is in: it would only catch the lock
    // mid-turn. The burst reads once the lock has had time to turn; a failure
    // is no news about the lock and starts none.
    if (result.value?.opened === true) {
      startBurst("open", undefined);
    }

    letResultPass();
  }
}

async function closeDoor() {
  if (cooling.value) {
    return;
  }

  beginAction("close");
  beginCooldown();

  // The close answer carries the state after closing - one roundtrip saved.
  let stateAfterClosing = null;

  try {
    const outcome = readCloseOutcome(
      await close(props.tenantId, props.accessPoint.id, bookingId.value),
    );
    result.value = outcome;
    stateAfterClosing = outcome.status;
  } catch (error) {
    if (isLockBusy(error)) {
      settleLockBusy("close");
    } else {
      console.error("Door could not be closed:", error);
      result.value = { closed: false, error: ACCESS_ERRORS.CLOSE_FAILED };
    }
  } finally {
    action.value = null;

    // The backend's own read inside close is read zero of the burst: where it
    // already reports locked, nothing more is scheduled.
    if (result.value?.closed === true) {
      startBurst("close", stateAfterClosing);
    }

    letResultPass();
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
  stopBurst();
  stopBusyRead();
  stopCooldownTicker();

  // The sheet's last word to the key row: what it knew as it closed, a burst
  // still running or not. The row keeps that and does not read again.
  if (status.value !== undefined) {
    emit("status", status.value);
  }
});
</script>

<style scoped>
/*
  The read sticker, given the moment it needs. The square is lifted out of the
  flow for it, so the stage underneath is already the one that follows: nothing
  waits for this fade, it only happens to cover it. The green itself is the
  scanner's own (`hit` there) - all that is decided here is how long what it
  painted stays to be seen.
*/
.scan-hit-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  transition:
    opacity 300ms ease-out 140ms,
    transform 440ms ease-out;
}
.scan-hit-leave-to {
  opacity: 0;
  transform: scale(1.03);
}

/* The motion goes, the answer stays: the check still has its moment, it just
   does not grow while it fades. */
@media (prefers-reduced-motion: reduce) {
  .scan-hit-leave-active {
    transition: opacity 200ms ease-out 200ms;
  }
  .scan-hit-leave-to {
    transform: none;
  }
}
</style>

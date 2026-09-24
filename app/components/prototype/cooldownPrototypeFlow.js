/**
 * PROTOTYPE - throwaway. Answers ticket 03 of .scratch/nuki-lock-feedback:
 * how the Control Button behaves during the 8 s Cooldown and how the long
 * press reads the status. Simulates a Nuki (async turn, 423 while busy) in
 * memory. Nothing here is production code.
 */
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";

export const COOLDOWN_MS = 8000;
export const SETTLE_MS = 1500;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function useCooldownPrototype() {
  const sim = reactive({
    busyReplies: true, // Nuki answers 423 while the previous action is running
    busyMs: 7000,
    turnMs: 1500, // how long the lock takes to physically turn
    commandMs: 400,
    statusMs: 600,
    statusFails: false,
  });
  const lock = reactive({ open: false, busyUntil: 0, turningUntil: 0 });

  const now = ref(Date.now());
  let ticker;
  onMounted(() => (ticker = setInterval(() => (now.value = Date.now()), 100)));
  onUnmounted(() => clearInterval(ticker));

  const status = ref(undefined);
  const action = ref(null);
  const reading = ref(false);
  const cooldownUntil = ref(0);
  const lastEvent = ref(null); // 'lock_busy' | 'tap_ignored' | 'refreshed' | null
  const log = ref([]);
  const note = (text) =>
    log.value.unshift(`${new Date().toLocaleTimeString("de-DE")}  ${text}`);

  const cooldownRemainingMs = computed(() =>
    Math.max(0, cooldownUntil.value - now.value),
  );
  const cooldownSeconds = computed(() =>
    Math.ceil(cooldownRemainingMs.value / 1000),
  );
  const cooling = computed(() => cooldownRemainingMs.value > 0);
  const cooldownProgress = computed(() =>
    cooling.value ? 1 - cooldownRemainingMs.value / COOLDOWN_MS : 0,
  );
  const lockTurning = computed(() => now.value < lock.turningUntil);

  const stage = computed(() => {
    if (action.value === "open") return "opening";
    if (action.value === "close") return "closing";
    if (status.value === undefined) return "loading";
    if (status.value === null) return "error";
    return status.value.open ? "can_close" : "can_open";
  });
  /** The action the button offers - the one the Cooldown holds back. */
  const variant = computed(() =>
    stage.value === "can_close" ? "close" : "open",
  );

  async function simCommand(kind) {
    await delay(sim.commandMs);
    if (sim.busyReplies && Date.now() < lock.busyUntil) {
      const error = new Error("Request failed with status code 423");
      error.status = 423;
      throw error;
    }
    lock.busyUntil = Date.now() + sim.busyMs;
    lock.turningUntil = Date.now() + sim.turnMs;
    setTimeout(() => (lock.open = kind === "open"), sim.turnMs);
  }
  async function simStatus() {
    await delay(sim.statusMs);
    if (sim.statusFails) throw new Error("status unavailable");
    return { open: lock.open };
  }

  function startCooldown(reason) {
    cooldownUntil.value = Date.now() + COOLDOWN_MS;
    note(`Cooldown ${reason} (${COOLDOWN_MS / 1000} s)`);
  }

  async function refreshStatus(source = "long press") {
    if (reading.value) return;
    reading.value = true;
    note(`Status wird gelesen (${source}) …`);
    try {
      const read = await simStatus();
      status.value = { ...read, statusSource: "provider" };
      note(`Status: ${read.open ? "offen" : "abgeschlossen"}`);
      lastEvent.value = "refreshed";
    } catch {
      status.value = null;
      note("Status nicht lesbar");
    } finally {
      reading.value = false;
    }
  }

  /** A tap on the button. Returns what happened, so a variant can react. */
  async function tap() {
    if (action.value || reading.value) return "busy";
    if (cooling.value) {
      lastEvent.value = "tap_ignored";
      note(`Tipp ignoriert, noch ${cooldownSeconds.value} s`);
      return "cooling";
    }
    const kind = variant.value;
    action.value = kind;
    lastEvent.value = null;
    note(`Befehl gesendet: ${kind === "open" ? "Öffnen" : "Schließen"}`);
    try {
      await simCommand(kind);
      status.value = { open: kind === "open", statusSource: "command_result" };
      note("Nuki: 204, Befehl angenommen (optimistischer Status)");
      startCooldown("gestartet");
      action.value = null;
      settle();
      return "sent";
    } catch (error) {
      action.value = null;
      if (error.status === 423) {
        note("Nuki: 423 Lock Busy");
        lastEvent.value = "lock_busy";
        startCooldown("neu gestartet nach Lock Busy");
        return "lock_busy";
      }
      status.value = null;
      note("Befehl fehlgeschlagen");
      return "failed";
    }
  }

  /** One confirming read inside the Cooldown (the cadence is ticket 04). */
  async function settle() {
    await delay(SETTLE_MS);
    await refreshStatus("Bestätigung nach Befehl");
  }

  function reset() {
    lock.open = false;
    lock.busyUntil = 0;
    lock.turningUntil = 0;
    status.value = { open: false, statusSource: "provider" };
    cooldownUntil.value = 0;
    lastEvent.value = null;
    log.value = [];
  }
  onMounted(reset);

  return {
    sim,
    lock,
    status,
    stage,
    variant,
    action,
    reading,
    cooling,
    cooldownRemainingMs,
    cooldownSeconds,
    cooldownProgress,
    lockTurning,
    lastEvent,
    log,
    tap,
    refreshStatus,
    reset,
  };
}

/**
 * Press-and-hold on one element, with a keyboard twin (hold Space/Enter).
 * Short release before the threshold is a tap.
 */
export function useHoldGesture({ thresholdMs, onTap, onHold }) {
  const holding = ref(false);
  const progress = ref(0);
  let startedAt = 0;
  let frame = null;
  let fired = false;

  function begin() {
    if (holding.value) return;
    holding.value = true;
    fired = false;
    startedAt = performance.now();
    const step = () => {
      progress.value = Math.min(1, (performance.now() - startedAt) / thresholdMs);
      if (progress.value >= 1) {
        fired = true;
        holding.value = false;
        progress.value = 0;
        onHold?.();
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }
  function end(cancelled = false) {
    if (!holding.value) return;
    cancelAnimationFrame(frame);
    holding.value = false;
    progress.value = 0;
    if (!fired && !cancelled) onTap?.();
  }

  const handlers = {
    onPointerdown: (e) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {
        /* synthetic pointer, nothing to capture */
      }
      begin();
    },
    onPointerup: () => end(),
    onPointercancel: () => end(true),
    onPointerleave: () => end(true),
    onContextmenu: (e) => e.preventDefault(),
    onKeydown: (e) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        begin();
      }
    },
    onKeyup: (e) => {
      if (e.key === " " || e.key === "Enter") end();
    },
  };

  return { holding, progress, handlers };
}

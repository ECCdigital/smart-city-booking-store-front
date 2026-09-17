import { crossedBoundaries, nextBoundary } from "~/utils/accessWindow.js";

/**
 * The injection key under which the page's clock hands `now` down to every
 * key row and to the sheet, however deep they sit - a string rather than a
 * Symbol so it survives hot reloads, like the other keys in this repo.
 */
const ACCESS_NOW_KEY = "accessClockNow";

/** `setTimeout` overflows past this and fires at once; a timer is clamped and re-armed. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * The clock the Access Window is read against, instantiated **once per page**
 * and handed to rows and sheet through `useAccessNow()`.
 *
 * It exposes `now` as a ref and moves it only when something on the screen
 * changes: one `setTimeout` on the next boundary (`accessFrom` / `accessTo`
 * of any visible door, → `nextBoundary`), re-armed after each crossing and
 * whenever the doors change. Between boundaries nothing ticks - every row is
 * a function of `now`, and a `now` that does not move costs nothing.
 *
 * Background tabs throttle timers, so the clock re-evaluates on
 * `visibilitychange` and `focus` and counts the boundaries that went by
 * meanwhile (→ `crossedBoundaries`).
 *
 * What a crossing means is the page's business, reported once per evaluation
 * through `onCrossing`:
 *
 * - a window **end** needs no request - badge, line and button follow `now`;
 * - a window **start** needs the server: only it can put a door into the
 *   remote-operable list, so the page reloads its list silently;
 * - a **return to the tab** after a crossing while hidden is reported with
 *   `resumed: true`, so the page can reload whatever the throttled timer
 *   missed.
 *
 * @param {import("vue").Ref<Object[]>|(() => Object[])} doors The visible
 *   access points with their window fields - a ref, a computed or a getter
 * @param {Object} [handlers]
 * @param {(crossing: { starts: number, ends: number, resumed: boolean }) => void}
 *   [handlers.onCrossing] Called after a boundary was crossed; `starts` and
 *   `ends` count the boundaries since the last look, `resumed` says the look
 *   was the return to the tab
 * @returns {{ now: import("vue").Ref<number>, refresh: () => void }} `now`
 *   as epoch ms; `refresh` re-evaluates at once (a page may call it after a
 *   reload of its own)
 */
export function useAccessClock(doors, { onCrossing } = {}) {
  const now = ref(Date.now());
  const list = () => unref(typeof doors === "function" ? doors() : doors) ?? [];

  let timer = null;
  /** A boundary went by while the tab was hidden; reported at the return. */
  let crossedWhileHidden = false;

  const hidden = () =>
    typeof document !== "undefined" && document.visibilityState === "hidden";

  function disarm() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /** One timeout on the next boundary - or none, where every boundary lies behind. */
  function arm() {
    disarm();

    const next = nextBoundary(list(), now.value);
    if (next === null) {
      return;
    }

    const delay = Math.min(Math.max(0, next - Date.now()), MAX_TIMEOUT_MS);
    timer = setTimeout(() => evaluate(), delay);
  }

  /**
   * Moves `now` and reports what was crossed since the last look. A timer that
   * fires early (clamped, or a throttled tab that woke late) reports nothing
   * and merely re-arms.
   */
  function evaluate({ resumed = false } = {}) {
    const since = now.value;
    now.value = Date.now();

    const crossed = crossedBoundaries(list(), since, now.value);
    const any = crossed.starts > 0 || crossed.ends > 0;

    if (any && hidden()) {
      crossedWhileHidden = true;
    }
    if (any || (resumed && crossedWhileHidden)) {
      if (resumed) {
        crossedWhileHidden = false;
      }
      onCrossing?.({ ...crossed, resumed });
    }

    arm();
  }

  function onVisibilityChange() {
    if (!hidden()) {
      evaluate({ resumed: true });
    }
  }

  function onFocus() {
    evaluate({ resumed: true });
  }

  // The doors change with every load; the timer follows them.
  watch(list, arm, { immediate: true });

  onMounted(() => {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
  });

  onUnmounted(() => {
    disarm();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
  });

  provide(ACCESS_NOW_KEY, now);

  return { now, refresh: () => evaluate() };
}

/**
 * The page's `now`, for a row or the sheet anywhere below it. Where no clock
 * was provided - the scan landing page today - a still `now` from the moment
 * of setup, so every reader has a number and none has a timer of its own.
 *
 * @returns {import("vue").Ref<number>}
 */
export function useAccessNow() {
  return inject(ACCESS_NOW_KEY, null) ?? ref(Date.now());
}

<template>
  <div class="relative flex items-center justify-center mb-12">
    <!-- the pulsing halo: an invitation to tap, so it stops where a tap is not taken -->
    <div
      v-if="!cooling && !reading"
      class="absolute w-28 h-28 rounded-full border-[12px] animate-ping [animation-duration:2.5s]"
      :class="haloClass"
    />

    <!--
      The ring that drains clockwise over the Cooldown: rotated to start at
      12 o'clock, and the offset negative, so the gap opens clockwise from
      there and the remaining arc ends where it began.
    -->
    <svg
      v-if="cooling"
      class="absolute w-40 h-40 -rotate-90 pointer-events-none"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="3"
      />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="RING"
        :stroke-dashoffset="-RING * cooldownProgress"
        class="text-neutral-500 transition-[stroke-dashoffset] duration-100 ease-linear"
      />
    </svg>

    <button
      type="button"
      class="controlButton rounded-full flex flex-col items-center justify-center shadow-lg text-white select-none touch-none overflow-hidden outline-none focus-visible:ring-4 ring-primary/40"
      :class="[buttonClass, { shake: shaking }]"
      :aria-label="ariaLabel"
      :aria-busy="reading || undefined"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointercancel="cancelHold"
      @pointerleave="cancelHold"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
      @contextmenu.prevent
      @animationend="onAnimationEnd"
    >
      <!-- the ripple that grows from the centre while the button is held -->
      <span
        class="ripple absolute inset-0 m-auto rounded-full bg-white/30"
        :class="{ 'ripple--growing': holding }"
        aria-hidden="true"
      />

      <template v-if="reading">
        <div
          class="relative w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin"
        />
        <span class="relative text-xs mt-2">
          {{ t("mobileKey.cooldown.reading") }}
        </span>
      </template>
      <template v-else-if="holding">
        <UIcon
          name="i-lucide-refresh-cw"
          class="relative !text-[22px] animate-spin [animation-duration:1.5s]"
        />
        <span class="relative text-xs mt-2">
          {{ t("mobileKey.cooldown.holding") }}
        </span>
      </template>
      <template v-else-if="cooling">
        <span class="relative text-4xl font-semibold tabular-nums leading-none">
          {{ cooldownSeconds }}
        </span>
        <span class="relative text-xs mt-1 opacity-80">
          {{ t("mobileKey.cooldown.seconds") }}
        </span>
      </template>
      <template v-else>
        <UIcon :name="icon" class="relative !text-[20px] text-white" />
        <span class="relative text-sm font-medium text-white mt-2">
          {{ label }}
        </span>
      </template>
    </button>
  </div>
  <div class="text-center text-sm">
    <p v-if="title" class="mb-1">{{ title }}</p>
    <template v-if="cooling">
      <p class="font-medium">{{ caption }}</p>
      <!-- Lock Busy: an outcome, not an error - one amber line, no screen -->
      <p v-if="busyNotice" class="mt-1 text-amber-600" role="status">
        {{ t("mobileKey.cooldown.busy") }}
      </p>
    </template>
    <template v-else>
      {{ subtitle }}
      <span class="font-semibold"> {{ accessPointLabel }} </span>
    </template>
  </div>
</template>
<script setup>
/**
 * The Control Button: one tap sends the booker's one action. Two things sit on
 * top of that tap and are decided here, because they are gestures and not
 * stages:
 *
 * - the **Cooldown**, handed in as a flag: a tap is not taken while it holds,
 *   the button shakes once instead and nothing is sent;
 * - the **hold**: pressing for `HOLD_MS` reads the status without sending a
 *   command, at any time, inside and outside the Cooldown. Release before
 *   that is a tap. Touch, mouse and Space/Enter on the focused button all
 *   count. The gesture is deliberately not explained anywhere on the sheet;
 *   the `aria-label` names it.
 */
const props = defineProps({
  variant: {
    type: String,
    required: true,
  },
  accessPointLabel: {
    type: String,
    default: "",
  },
  /**
   * The line above the caption. A prop rather than a switch because the
   * wording now lives in `de.json` - and because the flow, not the button,
   * knows whether evidence was collected in this very session.
   */
  title: {
    type: String,
    default: "",
  },
  /** The Cooldown flag: a tap is not taken while it holds. */
  cooling: {
    type: Boolean,
    default: false,
  },
  /** The digit on the button while cooling. */
  cooldownSeconds: {
    type: Number,
    default: 0,
  },
  /** How far the ring has drained, `0` to `1`. */
  cooldownProgress: {
    type: Number,
    default: 0,
  },
  /** A status read is running: spinner, and a hold that lands now is absorbed. */
  reading: {
    type: Boolean,
    default: false,
  },
  /**
   * The lock answered Lock Busy to the last command: the amber line under the
   * caption saying the wait starts over. The flow raises it together with the
   * restarted Cooldown and only while that Cooldown holds.
   */
  busyNotice: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["open", "lock", "refresh"]);

const { t } = useI18n();

/** Circumference of the draining ring, `r = 46` in a 100-unit viewBox. */
const RING = 2 * Math.PI * 46;

/** How long a press has to last to be a hold rather than a tap. */
const HOLD_MS = 800;

const holding = ref(false);
const shaking = ref(false);

/**
 * The pending threshold of the current press; `null` when nothing is pressed -
 * and `null` again once the hold fired, so that press's release is no tap.
 */
let holdTimer = null;

const label = computed(() => {
  switch (props.variant) {
    case "open":
      return "Öffnen";
    case "close":
      return "Abschließen";
    default:
      return "";
  }
});
const icon = computed(() => {
  switch (props.variant) {
    case "open":
      return "i-lucide-unlock";
    case "close":
      return "i-lucide-lock";
    default:
      return "";
  }
});

const subtitle = computed(() => {
  switch (props.variant) {
    case "open":
      return `Tippen Sie zum Öffnen von`;
    case "close":
      return `Tippen Sie zum Abschließen von`;
    default:
      return "";
  }
});

/** The action the Cooldown holds back, for the caption and the aria-label. */
const captionKey = computed(() =>
  props.variant === "close" ? "close" : "open",
);

const caption = computed(() =>
  t(`mobileKey.cooldown.caption.${captionKey.value}`, {
    n: props.cooldownSeconds,
  }),
);

const ariaLabel = computed(() => {
  if (props.reading) {
    return t("mobileKey.cooldown.aria.reading");
  }
  if (props.cooling) {
    return t(`mobileKey.cooldown.aria.${captionKey.value}_in`, {
      n: props.cooldownSeconds,
    });
  }
  return t(`mobileKey.cooldown.aria.${captionKey.value}`);
});

const haloClass = computed(() => {
  switch (props.variant) {
    case "open":
      return "border-primary/30";
    case "close":
      return "border-error/30";
    default:
      return "";
  }
});
const buttonClass = computed(() => {
  if (props.cooling || props.reading) {
    return "coolColor";
  }
  switch (props.variant) {
    case "open":
      return "openColor";
    case "close":
      return "closeColor";
    default:
      return "";
  }
});

/** A press begins: the ripple starts growing, the threshold starts counting. */
function beginHold() {
  if (holdTimer !== null) {
    return;
  }
  holding.value = true;
  holdTimer = setTimeout(() => {
    holdTimer = null;
    holding.value = false;
    // A read already running absorbs the hold: the spinner it shows is the
    // whole answer, and the flow starts no second read either.
    emit("refresh");
  }, HOLD_MS);
}

/** A press ends: before the threshold it was a tap, after it nothing more. */
function endHold() {
  const wasPressed = holdTimer !== null;
  cancelHold();
  if (wasPressed) {
    onTap();
  }
}

/** The press goes away without a release counting: no tap, no hold. */
function cancelHold() {
  if (holdTimer !== null) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  holding.value = false;
}

/** How long the shake plays; the fallback that ends it where no animation runs. */
const SHAKE_MS = 450;

/** The end of the current shake, `null` while none plays. */
let shakeTimer = null;

/**
 * The tap: held back by the Cooldown with a shake - also while a burst read
 * has the spinner up, the Cooldown is what the person runs into - otherwise
 * ignored during a read, otherwise the command.
 */
function onTap() {
  if (props.cooling) {
    shake();
    return;
  }
  if (props.reading) {
    return;
  }
  switch (props.variant) {
    case "open":
      emit("open");
      break;
    case "close":
      emit("lock");
      break;
  }
}

/**
 * One shake. `animationend` ends it where the animation plays; under
 * `prefers-reduced-motion` it never starts, so a timeout of its length ends
 * it instead - else the flag would stick and no later tap could shake.
 */
function shake() {
  shaking.value = true;
  clearTimeout(shakeTimer);
  shakeTimer = setTimeout(endShake, SHAKE_MS);
}

function endShake() {
  clearTimeout(shakeTimer);
  shakeTimer = null;
  shaking.value = false;
}

/** The shake has played out; the next held-back tap may shake again. */
function onAnimationEnd(event) {
  if (event.animationName === "shake") {
    endShake();
  }
}

function onPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }
  // Keep the pointer's release ours even when the finger drifts off the button.
  event.currentTarget.setPointerCapture?.(event.pointerId);
  beginHold();
}

function onPointerUp() {
  endHold();
}

/** Space and Enter hold like a finger does; the key's own repeat is ignored. */
function onKeyDown(event) {
  if (event.key !== " " && event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  if (!event.repeat) {
    beginHold();
  }
}

function onKeyUp(event) {
  if (event.key !== " " && event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  endHold();
}

onUnmounted(() => {
  cancelHold();
  endShake();
});
</script>
<style scoped>
.controlButton {
  position: relative;
  width: 120px;
  height: 120px;
  z-index: 10;
  cursor: pointer;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.openColor {
  background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
  );
}
.closeColor {
  background: linear-gradient(
    180deg,
    #f15d5d,
    color-mix(in srgb, #f15d5d 85%, black)
  );
}
.coolColor {
  background: linear-gradient(180deg, #9ca3af, #6b7280);
}

/* The ripple grows over the hold threshold and snaps back on release. */
.ripple {
  transform: scale(0);
  transition: transform 200ms ease-out;
}
.ripple--growing {
  transform: scale(1);
  transition: transform 800ms linear;
}

/* The one answer to a tap the Cooldown holds back. */
.shake {
  animation: shake 450ms;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shake {
    animation: none;
  }
}
</style>

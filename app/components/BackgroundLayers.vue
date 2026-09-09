<script setup>
import {
  backgroundRootStyle,
  resolveBackground,
} from "~/utils/backgroundLayers";

/**
 * Paints one Background object as absolutely positioned layers inside
 * whatever box the caller gives it: the Hero's height box or the page
 * background's fixed viewport layer. One renderer, so the Hero and the auth
 * pages look the same because they run the same code.
 *
 * Every mode-dependent value comes from the `.dark` class through the custom
 * properties in `main.css`, never from JavaScript after mount — the server
 * already paints the right mode. The only inline values are the flat colour's
 * two custom properties.
 */
const props = defineProps({
  /** The Theme View's Background; `null` paints the default. */
  background: { type: Object, default: null },
});

const resolved = computed(() => resolveBackground(props.background));
const rootStyle = computed(() => backgroundRootStyle(resolved.value));

/** Fixed lookup with complete class literals — no dynamic class names. */
const intensityClasses = {
  subtle: "bg-intensity-subtle",
  normal: "bg-intensity-normal",
  strong: "bg-intensity-strong",
};

const variantBackground = computed(() =>
  resolved.value.type === "variant" ? resolved.value : null,
);
const intensityClass = computed(() =>
  variantBackground.value
    ? intensityClasses[variantBackground.value.intensity]
    : "",
);
// `minimal` is the base gradient alone; orbs are the one thing it never has.
const orbs = computed(
  () =>
    Boolean(variantBackground.value?.orbs) &&
    variantBackground.value.variant !== "minimal",
);
</script>

<template>
  <div
    class="absolute inset-0 overflow-hidden"
    :class="intensityClass"
    :style="rootStyle"
    aria-hidden="true"
  >
    <template v-if="variantBackground">
      <div class="absolute inset-0 base-gradient" />

      <div v-if="variantBackground.variant === 'mesh'" class="absolute inset-0">
        <div class="mesh-shape mesh-1" />
        <div class="mesh-shape mesh-2" />
        <div class="mesh-shape mesh-3" />
        <div class="mesh-shape mesh-4" />
      </div>

      <div
        v-if="variantBackground.variant === 'aurora'"
        class="absolute inset-0 overflow-hidden"
      >
        <div class="aurora aurora-1" />
        <div class="aurora aurora-2" />
        <div class="aurora aurora-3" />
      </div>

      <svg
        v-if="variantBackground.variant === 'poly'"
        class="absolute inset-0 w-full h-full poly"
        viewBox="0 0 200 120"
        preserveAspectRatio="xMidYMid slice"
      >
        <!-- Large background facets -->
        <polygon points="0,0 100,0 50,40 0,30" class="poly-base" fill-opacity="0.06" />
        <polygon points="100,0 200,0 200,35 140,25" class="poly-base" fill-opacity="0.04" />
        <polygon points="0,30 50,40 40,80 0,70" class="poly-base" fill-opacity="0.03" />
        <polygon points="50,40 140,25 120,70 60,60" class="poly-base" fill-opacity="0.08" />
        <polygon points="140,25 200,35 200,80 150,65" class="poly-base" fill-opacity="0.05" />
        <polygon points="0,70 40,80 30,120 0,120" class="poly-base" fill-opacity="0.02" />
        <polygon points="40,80 120,70 100,120 30,120" class="poly-base" fill-opacity="0.06" />
        <polygon points="120,70 150,65 200,80 200,120 100,120" class="poly-base" fill-opacity="0.04" />

        <!-- Accent facets -->
        <polygon points="60,35 80,20 95,45" class="poly-accent" fill-opacity="0.12" />
        <polygon points="150,50 170,35 180,60" class="poly-accent" fill-opacity="0.1" />
        <polygon points="70,85 90,70 100,90" class="poly-accent" fill-opacity="0.08" />

        <!-- Edges -->
        <line x1="50" y1="40" x2="140" y2="25" class="poly-line" stroke-opacity="0.1" stroke-width="0.3" />
        <line x1="50" y1="40" x2="60" y2="60" class="poly-line" stroke-opacity="0.08" stroke-width="0.3" />
        <line x1="120" y1="70" x2="150" y2="65" class="poly-line" stroke-opacity="0.08" stroke-width="0.3" />
        <line x1="40" y1="80" x2="120" y2="70" class="poly-line" stroke-opacity="0.06" stroke-width="0.3" />
      </svg>

      <div
        v-if="variantBackground.variant === 'grid'"
        class="absolute inset-0 grid-pattern"
      />

      <template v-if="orbs">
        <div class="orb orb-1" />
        <div class="orb orb-2" />
        <div class="orb orb-3" />
        <div v-if="variantBackground.variant !== 'poly'" class="orb orb-4" />
      </template>

      <template v-if="orbs && variantBackground.variant === 'poly'">
        <div class="blur-shape blur-1" />
        <div class="blur-shape blur-2" />
        <div class="blur-shape blur-3" />
      </template>

      <div
        v-if="variantBackground.noise"
        class="absolute inset-0 noise pointer-events-none"
      />
    </template>

    <div v-else-if="resolved.type === 'color'" class="absolute inset-0 flat" />

    <!-- The image family lands with its preload and placeholder; until then it paints nothing. -->
  </div>
</template>

<style scoped>
/*
 * Every colour and mode-dependent opacity is a custom property from main.css;
 * this file only lays the shapes out and scales them by --bg-intensity.
 */
.bg-intensity-subtle {
  --bg-intensity: 0.5;
}

.bg-intensity-normal {
  --bg-intensity: 1;
}

.bg-intensity-strong {
  --bg-intensity: 1.5;
}

.base-gradient {
  background: linear-gradient(
    to bottom right,
    var(--bg-gradient-from),
    var(--bg-gradient-via),
    var(--bg-gradient-to)
  );
}

.flat {
  background-color: var(--bg-light);
}

.dark .flat {
  background-color: var(--bg-dark);
}

/* Mesh: four soft gradient blobs */
.mesh-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: float 30s ease-in-out infinite;
}

.mesh-1 {
  width: 45%;
  height: 50%;
  top: -10%;
  left: -10%;
  background: linear-gradient(135deg, var(--bg-primary-from), var(--bg-primary-to));
  opacity: calc(0.3 * var(--bg-intensity));
}

.mesh-2 {
  width: 40%;
  height: 45%;
  top: 20%;
  right: -5%;
  background: linear-gradient(135deg, var(--bg-secondary-from), var(--bg-secondary-to));
  opacity: calc(0.25 * var(--bg-intensity));
  animation-delay: -7s;
}

.mesh-3 {
  width: 35%;
  height: 40%;
  bottom: 10%;
  left: 20%;
  background: linear-gradient(135deg, var(--bg-tertiary-from), var(--bg-tertiary-to));
  opacity: calc(0.3 * var(--bg-intensity));
  animation-delay: -15s;
}

.mesh-4 {
  width: 30%;
  height: 35%;
  bottom: -5%;
  right: 15%;
  background: linear-gradient(135deg, var(--bg-quaternary-from), var(--bg-quaternary-to));
  opacity: calc(0.2 * var(--bg-intensity));
  animation-delay: -22s;
}

/* Aurora: three drifting bands; their opacity is animated, so intensity does not apply */
.aurora {
  position: absolute;
  width: 200%;
  height: 40%;
  filter: blur(100px);
  opacity: 0.3;
  animation: aurora 20s ease-in-out infinite;
}

.aurora-1 {
  top: -10%;
  left: -50%;
  background: linear-gradient(90deg, transparent, var(--bg-primary-from), var(--bg-primary-to), transparent);
}

.aurora-2 {
  top: 30%;
  left: -30%;
  background: linear-gradient(90deg, transparent, var(--bg-secondary-from), var(--bg-secondary-to), transparent);
  animation-delay: -7s;
}

.aurora-3 {
  top: 60%;
  left: -40%;
  background: linear-gradient(90deg, transparent, var(--bg-tertiary-from), var(--bg-tertiary-to), transparent);
  animation-delay: -14s;
}

/* Poly: intensity scales the whole drawing, each facet keeps its own fill-opacity */
.poly {
  opacity: calc(var(--bg-poly-opacity) * var(--bg-intensity));
}

.poly-base {
  fill: rgb(var(--bg-base));
}

.poly-accent {
  fill: rgb(var(--bg-accent));
}

.poly-line {
  stroke: rgb(var(--bg-line));
}

.blur-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: float 25s ease-in-out infinite;
}

.blur-1 {
  width: 40%;
  height: 50%;
  top: -15%;
  left: -5%;
  background: linear-gradient(135deg, var(--bg-primary-from), var(--bg-primary-to));
  opacity: calc(0.2 * var(--bg-intensity));
}

.blur-2 {
  width: 35%;
  height: 45%;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, var(--bg-secondary-from), var(--bg-secondary-to));
  opacity: calc(0.15 * var(--bg-intensity));
}

.blur-3 {
  width: 30%;
  height: 40%;
  top: 40%;
  left: 30%;
  background: linear-gradient(135deg, var(--bg-tertiary-from), var(--bg-tertiary-to));
  opacity: calc(0.18 * var(--bg-intensity));
}

/* Grid */
.grid-pattern {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, rgb(var(--bg-line)) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(var(--bg-line)) 1px, transparent 1px);
  opacity: calc(var(--bg-grid-opacity) * var(--bg-intensity));
}

/* Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: calc(var(--bg-orb-opacity) * var(--bg-intensity));
  animation: float 35s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  top: 5%;
  left: 5%;
  background: var(--bg-primary-from);
}

.orb-2 {
  width: 400px;
  height: 400px;
  top: 40%;
  right: 10%;
  background: var(--bg-secondary-from);
  animation-delay: -9s;
}

.orb-3 {
  width: 450px;
  height: 450px;
  bottom: 10%;
  left: 25%;
  background: var(--bg-tertiary-from);
  animation-delay: -18s;
}

.orb-4 {
  width: 350px;
  height: 350px;
  bottom: 5%;
  right: 20%;
  background: var(--bg-quaternary-from);
  animation-delay: -26s;
}

.noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: var(--bg-noise-opacity);
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -30px) scale(1.03);
  }
  50% {
    transform: translate(-15px, 20px) scale(0.97);
  }
  75% {
    transform: translate(-25px, -15px) scale(1.02);
  }
}

@keyframes aurora {
  0%,
  100% {
    transform: translateX(0) skewX(-15deg);
    opacity: 0.3;
  }
  50% {
    transform: translateX(25%) skewX(-15deg);
    opacity: 0.5;
  }
}

/* The shapes stay; only their drift stops. */
@media (prefers-reduced-motion: reduce) {
  .mesh-shape,
  .aurora,
  .blur-shape,
  .orb {
    animation: none;
  }
}
</style>

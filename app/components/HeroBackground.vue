<template>
  <div class="hero-bg relative w-full overflow-hidden" :class="heightClass">
    <div class="absolute inset-0" :class="baseGradientClass" />

    <div v-if="variant === 'mesh'" class="absolute inset-0">
      <div class="mesh-shape mesh-1" :class="meshClasses[0]" />
      <div class="mesh-shape mesh-2" :class="meshClasses[1]" />
      <div class="mesh-shape mesh-3" :class="meshClasses[2]" />
      <div class="mesh-shape mesh-4" :class="meshClasses[3]" />
    </div>

    <div v-if="variant === 'aurora'" class="absolute inset-0">
      <div class="aurora aurora-1" :class="auroraClasses[0]" />
      <div class="aurora aurora-2" :class="auroraClasses[1]" />
      <div class="aurora aurora-3" :class="auroraClasses[2]" />
    </div>

    <svg
        v-if="variant === 'poly'"
        class="absolute inset-0 w-full h-full opacity-70 dark:opacity-50"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid slice"
    >
      <polygon
          points="0,0 60,0 30,40 0,30"
          class="fill-slate-500/[0.08] dark:fill-white/[0.08]"
      />
      <polygon
          points="60,0 120,0 100,50 40,35"
          class="fill-slate-500/[0.05] dark:fill-white/[0.05]"
      />
      <polygon
          points="120,0 200,0 200,40 150,30"
          class="fill-slate-500/[0.1] dark:fill-white/[0.1]"
      />
      <polygon
          points="0,30 30,40 20,70 0,60"
          class="fill-slate-500/[0.04] dark:fill-white/[0.04]"
      />
      <polygon
          points="30,40 100,50 80,80 25,65"
          class="fill-slate-500/[0.12] dark:fill-white/[0.12]"
      />
      <polygon
          points="100,50 150,30 200,40 200,70 140,85"
          class="fill-slate-500/[0.06] dark:fill-white/[0.06]"
      />
      <polygon
          points="0,60 20,70 30,100 0,100"
          class="fill-slate-500/[0.03] dark:fill-white/[0.03]"
      />
      <polygon
          points="20,70 80,80 70,100 30,100"
          class="fill-slate-500/[0.08] dark:fill-white/[0.08]"
      />
      <polygon
          points="80,80 140,85 130,100 70,100"
          class="fill-slate-500/[0.05] dark:fill-white/[0.05]"
      />
      <polygon
          points="140,85 200,70 200,100 130,100"
          class="fill-slate-500/[0.04] dark:fill-white/[0.04]"
      />
      <!-- Akzent Polygone -->
      <polygon
          points="40,35 60,20 75,45"
          class="fill-indigo-500/20 dark:fill-indigo-400/20"
      />
      <polygon
          points="150,30 170,15 180,40"
          class="fill-indigo-500/15 dark:fill-indigo-400/15"
      />
      <polygon
          points="90,70 110,55 120,75"
          class="fill-indigo-500/12 dark:fill-indigo-400/12"
      />
      <!-- Kanten -->
      <line
          x1="30"
          y1="40"
          x2="100"
          y2="50"
          class="stroke-slate-600/15 dark:stroke-white/15"
          stroke-width="0.4"
      />
      <line
          x1="100"
          y1="50"
          x2="150"
          y2="30"
          class="stroke-slate-600/12 dark:stroke-white/12"
          stroke-width="0.4"
      />
      <line
          x1="80"
          y1="80"
          x2="140"
          y2="85"
          class="stroke-slate-600/10 dark:stroke-white/10"
          stroke-width="0.4"
      />
      <line
          x1="30"
          y1="40"
          x2="25"
          y2="65"
          class="stroke-slate-600/8 dark:stroke-white/8"
          stroke-width="0.4"
      />
      <line
          x1="150"
          y1="30"
          x2="140"
          y2="85"
          class="stroke-slate-600/10 dark:stroke-white/10"
          stroke-width="0.4"
      />
    </svg>

    <div
        v-if="variant === 'grid'"
        class="absolute inset-0 grid-pattern-light dark:grid-pattern-dark"
    />

    <template v-if="variant !== 'minimal'">
      <div class="orb orb-1" :class="orbClasses[0]" />
      <div class="orb orb-2" :class="orbClasses[1]" />
      <div class="orb orb-3" :class="orbClasses[2]" />
    </template>

    <div
        v-if="noise"
        class="absolute inset-0 noise opacity-[0.02] pointer-events-none"
    />

    <div
        v-if="fadeBottom"
        class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-950 to-transparent"
    />

    <div class="relative z-10 h-full">
      <slot />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "mesh",
    validator: (v) => ["mesh", "aurora", "poly", "grid", "minimal"].includes(v),
  },
  height: {
    type: String,
    default: "lg",
    validator: (v) => ["sm", "md", "lg", "xl", "full", "screen"].includes(v),
  },
  noise: {
    type: Boolean,
    default: true,
  },
  fadeBottom: {
    type: Boolean,
    default: false,
  },
});

const heightClass = computed(() => {
  const heights = {
    sm: "h-48",
    md: "h-64",
    lg: "h-96",
    xl: "h-[32rem]",
    full: "h-full",
    screen: "h-screen",
  };
  return heights[props.height];
});

const baseGradientClass =
    "bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950";

const meshClasses = [
  "bg-gradient-to-br from-indigo-200 to-violet-200 dark:from-indigo-500 dark:to-violet-500",
  "bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-500 dark:to-cyan-500",
  "bg-gradient-to-br from-violet-200 to-pink-200 dark:from-violet-500 dark:to-pink-500",
  "bg-gradient-to-br from-emerald-200 to-blue-200 dark:from-emerald-500 dark:to-blue-500",
];

const auroraClasses = [
  "aurora-gradient-1",
  "aurora-gradient-2",
  "aurora-gradient-3",
];

const orbClasses = [
  "bg-indigo-300 dark:bg-indigo-500 opacity-40 dark:opacity-30",
  "bg-blue-300 dark:bg-blue-500 opacity-40 dark:opacity-30",
  "bg-violet-300 dark:bg-violet-500 opacity-40 dark:opacity-30",
];
</script>

<style scoped>
/* Mesh Gradient Shapes */
.mesh-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.mesh-1 {
  width: 40%;
  height: 80%;
  top: -20%;
  left: -10%;
}

.mesh-2 {
  width: 35%;
  height: 70%;
  top: 10%;
  right: -5%;
  animation-delay: -5s;
}

.mesh-3 {
  width: 30%;
  height: 60%;
  bottom: -30%;
  left: 30%;
  animation-delay: -10s;
}

.mesh-4 {
  width: 25%;
  height: 50%;
  bottom: 0%;
  right: 20%;
  animation-delay: -15s;
}

/* Aurora Effect */
.aurora {
  position: absolute;
  width: 200%;
  height: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: aurora 15s ease-in-out infinite;
}

.aurora-1 {
  top: -20%;
  left: -50%;
}

.aurora-2 {
  top: 10%;
  left: -30%;
  animation-delay: -5s;
}

.aurora-3 {
  top: 30%;
  left: -40%;
  animation-delay: -10s;
}

/* Aurora gradients - brauchen CSS da Tailwind keine transparenten Gradienten hat */
.aurora-gradient-1 {
  background: linear-gradient(
      90deg,
      transparent,
      rgb(165 180 252),
      rgb(196 181 253),
      transparent
  );
}
.aurora-gradient-2 {
  background: linear-gradient(
      90deg,
      transparent,
      rgb(147 197 253),
      rgb(103 232 249),
      transparent
  );
}
.aurora-gradient-3 {
  background: linear-gradient(
      90deg,
      transparent,
      rgb(196 181 253),
      rgb(249 168 212),
      transparent
  );
}

:root.dark .aurora-gradient-1 {
  background: linear-gradient(
      90deg,
      transparent,
      rgb(99 102 241),
      rgb(139 92 246),
      transparent
  );
}
:root.dark .aurora-gradient-2 {
  background: linear-gradient(
      90deg,
      transparent,
      rgb(59 130 246),
      rgb(6 182 212),
      transparent
  );
}
:root.dark .aurora-gradient-3 {
  background: linear-gradient(
      90deg,
      transparent,
      rgb(139 92 246),
      rgb(236 72 153),
      transparent
  );
}

/* Floating Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 25s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
}

.orb-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 15%;
  animation-delay: -8s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  bottom: 10%;
  left: 40%;
  animation-delay: -16s;
}

/* Grid Pattern */
.grid-pattern-light {
  background-size: 50px 50px;
  background-image: linear-gradient(
      to right,
      rgb(71 85 105 / 0.15) 1px,
      transparent 1px
  ),
  linear-gradient(to bottom, rgb(71 85 105 / 0.15) 1px, transparent 1px);
}

.grid-pattern-dark {
  background-size: 50px 50px;
  background-image: linear-gradient(
      to right,
      rgb(255 255 255 / 0.08) 1px,
      transparent 1px
  ),
  linear-gradient(to bottom, rgb(255 255 255 / 0.08) 1px, transparent 1px);
}

/* Noise */
.noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* Animations */
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(10px, -20px) scale(1.05);
  }
  50% {
    transform: translate(-5px, 10px) scale(0.95);
  }
  75% {
    transform: translate(-15px, -10px) scale(1.02);
  }
}

@keyframes aurora {
  0%,
  100% {
    transform: translateX(0) skewX(-15deg);
    opacity: 0.4;
  }
  50% {
    transform: translateX(30%) skewX(-15deg);
    opacity: 0.6;
  }
}
</style>
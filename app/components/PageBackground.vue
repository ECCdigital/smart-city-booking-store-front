<template>
  <div class="page-wrapper relative min-h-screen">
    <!-- Fixed Background Layer -->
    <div class="fixed inset-0 -z-10">
      <!-- Base Gradient -->
      <div class="absolute inset-0" :class="baseGradient" />

      <!-- Mesh Variant -->
      <div v-if="variant === 'mesh'" class="absolute inset-0">
        <div
          v-for="shape in meshShapes"
          :key="shape.id"
          class="mesh-shape"
          :style="shape.style"
        />
      </div>

      <!-- Aurora Variant -->
      <div v-if="variant === 'aurora'" class="absolute inset-0 overflow-hidden">
        <div class="aurora aurora-1" :style="auroraColors[0]" />
        <div class="aurora aurora-2" :style="auroraColors[1]" />
        <div class="aurora aurora-3" :style="auroraColors[2]" />
      </div>

      <!-- Low-Poly Variant -->
      <svg
        v-if="variant === 'poly'"
        class="absolute inset-0 w-full h-full"
        :class="isDark ? 'opacity-40' : 'opacity-60'"
        viewBox="0 0 200 120"
        preserveAspectRatio="xMidYMid slice"
      >
        <!-- Große Hintergrund-Flächen -->
        <polygon points="0,0 100,0 50,40 0,30" :fill="polyFill(0.06)" />
        <polygon points="100,0 200,0 200,35 140,25" :fill="polyFill(0.04)" />
        <polygon points="0,30 50,40 40,80 0,70" :fill="polyFill(0.03)" />
        <polygon points="50,40 140,25 120,70 60,60" :fill="polyFill(0.08)" />
        <polygon points="140,25 200,35 200,80 150,65" :fill="polyFill(0.05)" />
        <polygon points="0,70 40,80 30,120 0,120" :fill="polyFill(0.02)" />
        <polygon points="40,80 120,70 100,120 30,120" :fill="polyFill(0.06)" />
        <polygon
          points="120,70 150,65 200,80 200,120 100,120"
          :fill="polyFill(0.04)"
        />

        <!-- Akzent Polygone -->
        <polygon points="60,35 80,20 95,45" :fill="polyAccent(0.12)" />
        <polygon points="150,50 170,35 180,60" :fill="polyAccent(0.1)" />
        <polygon points="70,85 90,70 100,90" :fill="polyAccent(0.08)" />

        <!-- Kanten -->
        <line
          x1="50"
          y1="40"
          x2="140"
          y2="25"
          :stroke="lineColor(0.1)"
          stroke-width="0.3"
        />
        <line
          x1="50"
          y1="40"
          x2="60"
          y2="60"
          :stroke="lineColor(0.08)"
          stroke-width="0.3"
        />
        <line
          x1="120"
          y1="70"
          x2="150"
          y2="65"
          :stroke="lineColor(0.08)"
          stroke-width="0.3"
        />
        <line
          x1="40"
          y1="80"
          x2="120"
          y2="70"
          :stroke="lineColor(0.06)"
          stroke-width="0.3"
        />
      </svg>

      <!-- Grid Variant -->
      <div
        v-if="variant === 'grid'"
        class="absolute inset-0"
        :style="gridStyle"
      />

      <!-- Floating Orbs -->
      <template v-if="colorful && variant !== 'minimal'">
        <div class="orb orb-1" :style="orbStyles[0]" />
        <div class="orb orb-2" :style="orbStyles[1]" />
        <div class="orb orb-3" :style="orbStyles[2]" />
        <div
          v-if="variant !== 'poly'"
          class="orb orb-4"
          :style="orbStyles[3]"
        />
      </template>

      <!-- Blur Shapes für Poly -->
      <template v-if="variant === 'poly' && colorful">
        <div
          v-for="shape in polyBlurShapes"
          :key="'poly-blur-' + shape.id"
          class="blur-shape"
          :style="shape.style"
        />
      </template>

      <!-- Noise Overlay -->
      <div
        v-if="noise"
        class="absolute inset-0 noise pointer-events-none"
        :class="isDark ? 'opacity-[0.015]' : 'opacity-[0.025]'"
      />

      <!-- Vignette Effekt (optional) -->
      <div
        v-if="vignette"
        class="absolute inset-0 pointer-events-none"
        :style="vignetteStyle"
      />
    </div>

    <div class="flex min-h-screen z-0">
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
  theme: {
    type: String,
    default: null, // null = auto-detect
    validator: (v) =>
      v === null || ["dark", "light", "purple", "blue", "emerald"].includes(v),
  },
  noise: {
    type: Boolean,
    default: true,
  },
  colorful: {
    type: Boolean,
    default: true,
  },
  vignette: {
    type: Boolean,
    default: false,
  },
  intensity: {
    type: String,
    default: "normal",
    validator: (v) => ["subtle", "normal", "strong"].includes(v),
  },
});

const colorMode = useColorMode();

const currentTheme = ref(props.theme || "light");
const isMounted = ref(false);

const theme = computed(() => {
  if (colorMode.value === "dark") return "dark";
  if (colorMode.value === "light") return "light";
  return "light";
});

onMounted(() => {
  if (!props.theme) {
    currentTheme.value = colorMode.value === "dark" ? "dark" : "light";
  }
  isMounted.value = true;
});

watch(
  () => colorMode.value,
  () => {
    if (!props.theme) {
      currentTheme.value = theme.value;
    }
  }
);

// Auto-detect theme
const isDark = computed(() => currentTheme.value === "dark");

// Intensity multiplier
const intensityMultiplier = computed(() => {
  const multipliers = { subtle: 0.5, normal: 1, strong: 1.5 };
  return multipliers[props.intensity];
});

const baseGradient = computed(() => {
  const gradients = {
    dark: "bg-gradient-to-br from-neutral-900 via-neutral-950 to-black",
    light: "bg-gradient-to-br from-gray-50 via-white to-gray-100",
    purple: "bg-gradient-to-br from-purple-50 via-white to-violet-50",
    blue: "bg-gradient-to-br from-blue-50 via-white to-cyan-50",
    emerald: "bg-gradient-to-br from-emerald-50 via-white to-teal-50",
  };
  return gradients[currentTheme.value];
});

// Theme-spezifische Farbpaletten
const themeColors = computed(() => {
  const palettes = {
    dark: {
      primary: ["#e67a00", "#ff8b00"],
      secondary: ["#1a8fb8", "#1d9ecc"],
      tertiary: ["#c2700a", "#e67a00"],
      quaternary: ["#1d9ecc", "#38bdf8"],
      accent: "255, 139, 0",
      base: "255, 255, 255",
      line: "255, 255, 255",
    },
    light: {
      primary: ["#a5b4fc", "#c4b5fd"],
      secondary: ["#93c5fd", "#67e8f9"],
      tertiary: ["#c4b5fd", "#f9a8d4"],
      quaternary: ["#6ee7b7", "#93c5fd"],
      accent: "99, 102, 241",
      base: "100, 116, 139",
      line: "71, 85, 105",
    },
    purple: {
      primary: ["#a78bfa", "#c4b5fd"],
      secondary: ["#818cf8", "#a5b4fc"],
      tertiary: ["#c084fc", "#e879f9"],
      quaternary: ["#8b5cf6", "#a78bfa"],
      accent: "139, 92, 246",
      base: "107, 33, 168",
      line: "88, 28, 135",
    },
    blue: {
      primary: ["#60a5fa", "#93c5fd"],
      secondary: ["#38bdf8", "#67e8f9"],
      tertiary: ["#818cf8", "#60a5fa"],
      quaternary: ["#22d3ee", "#38bdf8"],
      accent: "59, 130, 246",
      base: "30, 64, 175",
      line: "29, 78, 216",
    },
    emerald: {
      primary: ["#34d399", "#6ee7b7"],
      secondary: ["#2dd4bf", "#5eead4"],
      tertiary: ["#4ade80", "#34d399"],
      quaternary: ["#14b8a6", "#2dd4bf"],
      accent: "16, 185, 129",
      base: "6, 95, 70",
      line: "4, 120, 87",
    },
  };
  return palettes[currentTheme.value];
});

// Mesh Shapes
const meshShapes = computed(() => {
  if (!props.colorful) return [];
  const colors = themeColors.value;
  const intensity = intensityMultiplier.value;
  return [
    {
      id: 1,
      style: {
        width: "45%",
        height: "50%",
        top: "-10%",
        left: "-10%",
        background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
        opacity: 0.3 * intensity,
      },
    },
    {
      id: 2,
      style: {
        width: "40%",
        height: "45%",
        top: "20%",
        right: "-5%",
        background: `linear-gradient(135deg, ${colors.secondary[0]}, ${colors.secondary[1]})`,
        opacity: 0.25 * intensity,
      },
    },
    {
      id: 3,
      style: {
        width: "35%",
        height: "40%",
        bottom: "10%",
        left: "20%",
        background: `linear-gradient(135deg, ${colors.tertiary[0]}, ${colors.tertiary[1]})`,
        opacity: 0.3 * intensity,
      },
    },
    {
      id: 4,
      style: {
        width: "30%",
        height: "35%",
        bottom: "-5%",
        right: "15%",
        background: `linear-gradient(135deg, ${colors.quaternary[0]}, ${colors.quaternary[1]})`,
        opacity: 0.2 * intensity,
      },
    },
  ];
});

// Aurora Colors
const auroraColors = computed(() => {
  const colors = themeColors.value;
  return [
    {
      background: `linear-gradient(90deg, transparent, ${colors.primary[0]}, ${colors.primary[1]}, transparent)`,
    },
    {
      background: `linear-gradient(90deg, transparent, ${colors.secondary[0]}, ${colors.secondary[1]}, transparent)`,
    },
    {
      background: `linear-gradient(90deg, transparent, ${colors.tertiary[0]}, ${colors.tertiary[1]}, transparent)`,
    },
  ];
});

// Orb Styles
const orbStyles = computed(() => {
  const colors = themeColors.value;
  const opacity = (isDark.value ? 0.15 : 0.25) * intensityMultiplier.value;
  return [
    { background: colors.primary[0], opacity },
    { background: colors.secondary[0], opacity },
    { background: colors.tertiary[0], opacity },
    { background: colors.quaternary[0], opacity },
  ];
});

// Poly Blur Shapes
const polyBlurShapes = computed(() => {
  const colors = themeColors.value;
  const intensity = intensityMultiplier.value;
  return [
    {
      id: 1,
      style: {
        width: "40%",
        height: "50%",
        top: "-15%",
        left: "-5%",
        background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
        opacity: 0.2 * intensity,
      },
    },
    {
      id: 2,
      style: {
        width: "35%",
        height: "45%",
        bottom: "0%",
        right: "0%",
        background: `linear-gradient(135deg, ${colors.secondary[0]}, ${colors.secondary[1]})`,
        opacity: 0.15 * intensity,
      },
    },
    {
      id: 3,
      style: {
        width: "30%",
        height: "40%",
        top: "40%",
        left: "30%",
        background: `linear-gradient(135deg, ${colors.tertiary[0]}, ${colors.tertiary[1]})`,
        opacity: 0.18 * intensity,
      },
    },
  ];
});

// Polygon Helpers
const polyFill = (opacity) =>
  `rgba(${themeColors.value.base}, ${opacity * intensityMultiplier.value})`;
const polyAccent = (opacity) =>
  `rgba(${themeColors.value.accent}, ${opacity * intensityMultiplier.value})`;
const lineColor = (opacity) =>
  `rgba(${themeColors.value.line}, ${opacity * intensityMultiplier.value})`;

// Grid Style
const gridStyle = computed(() => {
  const color = themeColors.value.line;
  const opacity = (isDark.value ? 0.05 : 0.1) * intensityMultiplier.value;
  return {
    backgroundSize: "60px 60px",
    backgroundImage: `
      linear-gradient(to right, rgba(${color}, ${opacity}) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(${color}, ${opacity}) 1px, transparent 1px)
    `,
  };
});

// Vignette Style
const vignetteStyle = computed(() => {
  const color = isDark.value ? "0,0,0" : "0,0,0";
  const opacity = isDark.value ? 0.4 : 0.1;
  return {
    background: `radial-gradient(ellipse at center, transparent 0%, rgba(${color}, ${opacity}) 100%)`,
  };
});
</script>

<style scoped>
.mesh-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  animation: float 30s ease-in-out infinite;
}

.mesh-shape:nth-child(2) {
  animation-delay: -7s;
}

.mesh-shape:nth-child(3) {
  animation-delay: -15s;
}

.mesh-shape:nth-child(4) {
  animation-delay: -22s;
}

.blur-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  animation: float 25s ease-in-out infinite;
}

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
}

.aurora-2 {
  top: 30%;
  left: -30%;
  animation-delay: -7s;
}

.aurora-3 {
  top: 60%;
  left: -40%;
  animation-delay: -14s;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 35s ease-in-out infinite;
}

.orb-1 {
  width: 500px;
  height: 500px;
  top: 5%;
  left: 5%;
}

.orb-2 {
  width: 400px;
  height: 400px;
  top: 40%;
  right: 10%;
  animation-delay: -9s;
}

.orb-3 {
  width: 450px;
  height: 450px;
  bottom: 10%;
  left: 25%;
  animation-delay: -18s;
}

.orb-4 {
  width: 350px;
  height: 350px;
  bottom: 5%;
  right: 20%;
  animation-delay: -26s;
}

.noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
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
</style>

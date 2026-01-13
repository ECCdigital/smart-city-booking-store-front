<!-- components/ui/HeroBackground.vue -->
<template>
  <div class="hero-bg relative w-full overflow-hidden" :class="heightClass">
    <!-- Base Gradient -->
    <div class="absolute inset-0" :class="baseGradient" />

    <!-- Animated Mesh Gradient -->
    <div v-if="variant === 'mesh'" class="absolute inset-0">
      <div class="mesh-shape mesh-1" :style="meshColors[0]" />
      <div class="mesh-shape mesh-2" :style="meshColors[1]" />
      <div class="mesh-shape mesh-3" :style="meshColors[2]" />
      <div class="mesh-shape mesh-4" :style="meshColors[3]" />
    </div>

    <!-- Aurora Variant -->
    <div v-if="variant === 'aurora'" class="absolute inset-0">
      <div class="aurora aurora-1" :style="auroraColors[0]" />
      <div class="aurora aurora-2" :style="auroraColors[1]" />
      <div class="aurora aurora-3" :style="auroraColors[2]" />
    </div>

    <!-- Low-Poly Glass Variant -->
    <svg
        v-if="variant === 'poly'"
        class="absolute inset-0 w-full h-full"
        :class="isDark ? 'opacity-50' : 'opacity-70'"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid slice"
    >
      <!-- Große Flächen -->
      <polygon points="0,0 60,0 30,40 0,30" :fill="polyFill(0.08)" />
      <polygon points="60,0 120,0 100,50 40,35" :fill="polyFill(0.05)" />
      <polygon points="120,0 200,0 200,40 150,30" :fill="polyFill(0.1)" />
      <polygon points="0,30 30,40 20,70 0,60" :fill="polyFill(0.04)" />
      <polygon points="30,40 100,50 80,80 25,65" :fill="polyFill(0.12)" />
      <polygon points="100,50 150,30 200,40 200,70 140,85" :fill="polyFill(0.06)" />
      <polygon points="0,60 20,70 30,100 0,100" :fill="polyFill(0.03)" />
      <polygon points="20,70 80,80 70,100 30,100" :fill="polyFill(0.08)" />
      <polygon points="80,80 140,85 130,100 70,100" :fill="polyFill(0.05)" />
      <polygon points="140,85 200,70 200,100 130,100" :fill="polyFill(0.04)" />

      <!-- Akzent Polygone mit Farbe -->
      <polygon points="40,35 60,20 75,45" :fill="polyAccent(0.2)" />
      <polygon points="150,30 170,15 180,40" :fill="polyAccent(0.15)" />
      <polygon points="90,70 110,55 120,75" :fill="polyAccent(0.12)" />

      <!-- Kanten -->
      <line x1="30" y1="40" x2="100" y2="50" :stroke="lineColor(0.15)" stroke-width="0.4" />
      <line x1="100" y1="50" x2="150" y2="30" :stroke="lineColor(0.12)" stroke-width="0.4" />
      <line x1="80" y1="80" x2="140" y2="85" :stroke="lineColor(0.1)" stroke-width="0.4" />
      <line x1="30" y1="40" x2="25" y2="65" :stroke="lineColor(0.08)" stroke-width="0.4" />
      <line x1="150" y1="30" x2="140" y2="85" :stroke="lineColor(0.1)" stroke-width="0.4" />
    </svg>

    <!-- Grid Variant -->
    <div
        v-if="variant === 'grid'"
        class="absolute inset-0 grid-pattern"
        :style="gridStyle"
    />

    <!-- Floating Orbs -->
    <template v-if="variant !== 'minimal'">
      <div class="orb orb-1" :style="orbColors[0]" />
      <div class="orb orb-2" :style="orbColors[1]" />
      <div class="orb orb-3" :style="orbColors[2]" />
    </template>

    <!-- Noise Overlay -->
    <div v-if="noise" class="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

    <!-- Gradient Fade nach unten -->
    <div
        v-if="fadeBottom"
        class="absolute bottom-0 left-0 right-0 h-32"
        :style="fadeGradient"
    />

    <!-- Content Slot -->
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
  theme: {
    type: String,
    default: "light",
    validator: (v) => ["dark", "light", "purple", "blue", "emerald"].includes(v),
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

const isDark = computed(() => props.theme === "dark");

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

const baseGradient = computed(() => {
  const gradients = {
    dark: "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950",
    light: "bg-gradient-to-br from-gray-50 via-white to-gray-100",
    purple: "bg-gradient-to-br from-purple-50 via-white to-violet-100",
    blue: "bg-gradient-to-br from-blue-50 via-white to-cyan-100",
    emerald: "bg-gradient-to-br from-emerald-50 via-white to-teal-100",
  };
  return gradients[props.theme];
});

// Theme-spezifische Farbpaletten
const themeColors = computed(() => {
  const palettes = {
    dark: {
      primary: ["#6366f1", "#8b5cf6"],
      secondary: ["#3b82f6", "#06b6d4"],
      tertiary: ["#8b5cf6", "#ec4899"],
      quaternary: ["#10b981", "#3b82f6"],
      accent: "99, 102, 241",
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
  return palettes[props.theme];
});

// Mesh Farben
const meshColors = computed(() => {
  const colors = themeColors.value;
  return [
    { background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})` },
    { background: `linear-gradient(135deg, ${colors.secondary[0]}, ${colors.secondary[1]})` },
    { background: `linear-gradient(135deg, ${colors.tertiary[0]}, ${colors.tertiary[1]})` },
    { background: `linear-gradient(135deg, ${colors.quaternary[0]}, ${colors.quaternary[1]})` },
  ];
});

// Aurora Farben
const auroraColors = computed(() => {
  const colors = themeColors.value;
  return [
    { background: `linear-gradient(90deg, transparent, ${colors.primary[0]}, ${colors.primary[1]}, transparent)` },
    { background: `linear-gradient(90deg, transparent, ${colors.secondary[0]}, ${colors.secondary[1]}, transparent)` },
    { background: `linear-gradient(90deg, transparent, ${colors.tertiary[0]}, ${colors.tertiary[1]}, transparent)` },
  ];
});

// Orb Farben
const orbColors = computed(() => {
  const colors = themeColors.value;
  const opacity = isDark.value ? 0.3 : 0.4;
  return [
    { background: colors.primary[0], opacity },
    { background: colors.secondary[0], opacity },
    { background: colors.tertiary[0], opacity },
  ];
});

// Polygon Fill
const polyFill = (opacity) => {
  return `rgba(${themeColors.value.base}, ${opacity})`;
};

// Polygon Akzent
const polyAccent = (opacity) => {
  return `rgba(${themeColors.value.accent}, ${opacity})`;
};

// Linien Farbe
const lineColor = (opacity) => {
  return `rgba(${themeColors.value.line}, ${opacity})`;
};

// Grid Style
const gridStyle = computed(() => {
  const color = themeColors.value.line;
  const opacity = isDark.value ? 0.08 : 0.15;
  return {
    backgroundSize: "50px 50px",
    backgroundImage: `
      linear-gradient(to right, rgba(${color}, ${opacity}) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(${color}, ${opacity}) 1px, transparent 1px)
    `,
  };
});

// Fade Gradient
const fadeGradient = computed(() => {
  const fadeColors = {
    dark: "rgb(3, 7, 18)",
    light: "rgb(255, 255, 255)",
    purple: "rgb(250, 245, 255)",
    blue: "rgb(239, 246, 255)",
    emerald: "rgb(236, 253, 245)",
  };
  return {
    background: `linear-gradient(to top, ${fadeColors[props.theme]}, transparent)`,
  };
});
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
  animation-delay: 0s;
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
  animation-delay: 0s;
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

/* Floating Orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
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
.grid-pattern {
  width: 100%;
  height: 100%;
}

/* Noise */
.noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

/* Animations */
@keyframes float {
  0%, 100% {
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
  0%, 100% {
    transform: translateX(0) skewX(-15deg);
    opacity: 0.4;
  }
  50% {
    transform: translateX(30%) skewX(-15deg);
    opacity: 0.6;
  }
}
</style>
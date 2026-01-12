<template>
  <div class="w-full h-full relative overflow-hidden">
    <!-- Base Gradient -->
    <div class="absolute inset-0" :class="baseGradient" />

    <!-- Mesh Variant -->
    <div v-if="variant === 'mesh'" class="absolute inset-0">
      <div
        v-for="shape in meshShapes"
        :key="shape.id"
        class="blur-shape"
        :style="shape.style"
      />
    </div>

    <!-- Aurora Variant -->
    <div v-if="variant === 'aurora'" class="absolute inset-0">
      <div class="aurora aurora-1" :style="auroraColors[0]" />
      <div class="aurora aurora-2" :style="auroraColors[1]" />
      <div class="aurora aurora-3" :style="auroraColors[2]" />
    </div>

    <!-- Low-Poly SVG Layer -->
    <svg
      v-if="variant === 'poly'"
      class="absolute inset-0 w-full h-full"
      :class="isDark ? 'opacity-50' : 'opacity-70'"
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
    >
      <!-- Hintere Ebene -->
      <polygon points="0,0 80,0 40,50" :fill="polyFill(0.08)" />
      <polygon points="80,0 160,0 160,40 100,30" :fill="polyFill(0.05)" />
      <polygon points="0,0 0,60 40,50" :fill="polyFill(0.03)" />
      <polygon points="160,0 160,40 100,30 80,0" :fill="polyFill(0.06)" />

      <!-- Mittlere Ebene -->
      <polygon points="40,50 80,0 100,30 70,60" :fill="polyFill(0.12)" />
      <polygon points="100,30 160,40 140,70 70,60" :fill="polyFill(0.07)" />
      <polygon points="0,60 40,50 30,90 0,90" :fill="polyFill(0.02)" />
      <polygon points="40,50 70,60 50,90 30,90" :fill="polyFill(0.04)" />

      <!-- Vordere Ebene -->
      <polygon points="70,60 140,70 120,90 50,90" :fill="polyFill(0.06)" />
      <polygon points="140,70 160,40 160,90 120,90" :fill="polyFill(0.02)" />
      <polygon points="100,30 70,60 90,45" :fill="polyFill(0.15)" />

      <!-- Akzent-Flächen -->
      <polygon points="0,60 40,50 20,40 0,45" :fill="polyFill(0.04)" />
      <polygon points="80,0 40,50 60,20" :fill="polyFill(0.09)" />
      <polygon points="120,90 160,90 160,70 140,70" :fill="polyFill(0.01)" />

      <!-- Akzent Polygone mit Farbe -->
      <polygon points="90,45 100,30 110,50" :fill="polyAccent(0.2)" />
      <polygon points="70,60 90,45 85,65" :fill="polyAccent(0.12)" />

      <!-- Kanten-Highlights -->
      <line
        x1="40"
        y1="50"
        x2="80"
        y2="0"
        :stroke="lineColor(0.15)"
        stroke-width="0.3"
      />
      <line
        x1="80"
        y1="0"
        x2="100"
        y2="30"
        :stroke="lineColor(0.12)"
        stroke-width="0.3"
      />
      <line
        x1="100"
        y1="30"
        x2="70"
        y2="60"
        :stroke="lineColor(0.1)"
        stroke-width="0.3"
      />
      <line
        x1="70"
        y1="60"
        x2="40"
        y2="50"
        :stroke="lineColor(0.08)"
        stroke-width="0.3"
      />
      <line
        x1="90"
        y1="45"
        x2="100"
        y2="30"
        :stroke="lineColor(0.2)"
        stroke-width="0.3"
      />
    </svg>

    <!-- Grid Variant -->
    <div
      v-if="variant === 'grid'"
      class="absolute inset-0"
      :style="gridStyle"
    />

    <!-- Floating Orbs (alle außer minimal) -->
    <template v-if="variant !== 'minimal' && variant !== 'poly'">
      <div class="orb orb-1" :style="orbColors[0]" />
      <div class="orb orb-2" :style="orbColors[1]" />
      <div class="orb orb-3" :style="orbColors[2]" />
    </template>

    <!-- Blur Shapes für Poly Variant -->
    <template v-if="variant === 'poly' && colorful">
      <div
        v-for="shape in polyBlurShapes"
        :key="shape.id"
        class="blur-shape"
        :style="shape.style"
      />
    </template>

    <!-- Glass Card mit Icon -->
    <div
      v-if="showIcon"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="glass-card" :style="glassCardStyle">
        <slot>
          <UIcon :name="icon" class="w-10 h-10" :style="iconStyle" />
        </slot>
      </div>
    </div>

    <!-- Noise Overlay -->
    <div
      v-if="noise"
      class="absolute inset-0 opacity-[0.02] noise pointer-events-none"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "poly",
    validator: (v) => ["mesh", "aurora", "poly", "grid", "minimal"].includes(v),
  },
  theme: {
    type: String,
    default: "dark",
    validator: (v) =>
      ["dark", "light", "purple", "blue", "emerald"].includes(v),
  },
  icon: {
    type: String,
    default: "i-lucide-image",
  },
  showIcon: {
    type: Boolean,
    default: false,
  },
  noise: {
    type: Boolean,
    default: true,
  },
  colorful: {
    type: Boolean,
    default: true,
  },
});

const currentTheme = ref(props.theme);

watch(
  () => props.theme,
  (newTheme) => {
    currentTheme.value = newTheme;
  },
  { immediate: true }
);

const isDark = computed(() => currentTheme.value === "dark");

const baseGradient = computed(() => {
  const gradients = {
    dark: "bg-gradient-to-br from-gray-800 via-gray-900 to-black",
    light: "bg-gradient-to-br from-gray-100 via-white to-gray-200",
    purple: "bg-gradient-to-br from-purple-100 via-white to-violet-100",
    blue: "bg-gradient-to-br from-blue-100 via-white to-cyan-100",
    emerald: "bg-gradient-to-br from-emerald-100 via-white to-teal-100",
  };
  return gradients[currentTheme.value] ?? gradients.light;
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
      glass: "rgba(255, 255, 255, 0.08)",
      glassBorder: "rgba(255, 255, 255, 0.15)",
      iconColor: "rgba(255, 255, 255, 0.4)",
      borderGlow: "rgba(255, 255, 255, 0.1)",
    },
    light: {
      primary: ["#a5b4fc", "#c4b5fd"],
      secondary: ["#93c5fd", "#67e8f9"],
      tertiary: ["#c4b5fd", "#f9a8d4"],
      quaternary: ["#6ee7b7", "#93c5fd"],
      accent: "99, 102, 241",
      base: "100, 116, 139",
      line: "71, 85, 105",
      glass: "rgba(255, 255, 255, 0.6)",
      glassBorder: "rgba(148, 163, 184, 0.3)",
      iconColor: "rgba(100, 116, 139, 0.5)",
      borderGlow: "rgba(148, 163, 184, 0.2)",
    },
    purple: {
      primary: ["#a78bfa", "#c4b5fd"],
      secondary: ["#818cf8", "#a5b4fc"],
      tertiary: ["#c084fc", "#e879f9"],
      quaternary: ["#8b5cf6", "#a78bfa"],
      accent: "139, 92, 246",
      base: "107, 33, 168",
      line: "88, 28, 135",
      glass: "rgba(255, 255, 255, 0.6)",
      glassBorder: "rgba(167, 139, 250, 0.3)",
      iconColor: "rgba(139, 92, 246, 0.5)",
      borderGlow: "rgba(167, 139, 250, 0.2)",
    },
    blue: {
      primary: ["#60a5fa", "#93c5fd"],
      secondary: ["#38bdf8", "#67e8f9"],
      tertiary: ["#818cf8", "#60a5fa"],
      quaternary: ["#22d3ee", "#38bdf8"],
      accent: "59, 130, 246",
      base: "30, 64, 175",
      line: "29, 78, 216",
      glass: "rgba(255, 255, 255, 0.6)",
      glassBorder: "rgba(96, 165, 250, 0.3)",
      iconColor: "rgba(59, 130, 246, 0.5)",
      borderGlow: "rgba(96, 165, 250, 0.2)",
    },
    emerald: {
      primary: ["#34d399", "#6ee7b7"],
      secondary: ["#2dd4bf", "#5eead4"],
      tertiary: ["#4ade80", "#34d399"],
      quaternary: ["#14b8a6", "#2dd4bf"],
      accent: "16, 185, 129",
      base: "6, 95, 70",
      line: "4, 120, 87",
      glass: "rgba(255, 255, 255, 0.6)",
      glassBorder: "rgba(52, 211, 153, 0.3)",
      iconColor: "rgba(16, 185, 129, 0.5)",
      borderGlow: "rgba(52, 211, 153, 0.2)",
    },
  };
  return palettes[currentTheme.value] ?? palettes.light;
});

// Mesh Shapes
const meshShapes = computed(() => {
  if (!props.colorful) return [];
  const colors = themeColors.value;
  return [
    {
      id: 1,
      style: {
        width: "50%",
        height: "70%",
        top: "-20%",
        left: "-10%",
        background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
      },
    },
    {
      id: 2,
      style: {
        width: "40%",
        height: "60%",
        bottom: "-20%",
        right: "5%",
        background: `linear-gradient(135deg, ${colors.secondary[0]}, ${colors.secondary[1]})`,
      },
    },
    {
      id: 3,
      style: {
        width: "30%",
        height: "50%",
        top: "10%",
        right: "-10%",
        background: `linear-gradient(135deg, ${colors.tertiary[0]}, ${colors.tertiary[1]})`,
      },
    },
  ];
});

// Poly Blur Shapes
const polyBlurShapes = computed(() => {
  const colors = themeColors.value;
  return [
    {
      id: 1,
      style: {
        width: "50%",
        height: "70%",
        top: "-20%",
        left: "-10%",
        background: `linear-gradient(135deg, ${colors.primary[0]}, ${colors.primary[1]})`,
      },
    },
    {
      id: 2,
      style: {
        width: "40%",
        height: "60%",
        bottom: "-20%",
        right: "5%",
        background: `linear-gradient(135deg, ${colors.secondary[0]}, ${colors.secondary[1]})`,
      },
    },
    {
      id: 3,
      style: {
        width: "30%",
        height: "50%",
        top: "10%",
        right: "-10%",
        background: `linear-gradient(135deg, ${colors.tertiary[0]}, ${colors.tertiary[1]})`,
      },
    },
  ];
});

// Aurora Farben
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
    backgroundSize: "30px 30px",
    backgroundImage: `
      linear-gradient(to right, rgba(${color}, ${opacity}) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(${color}, ${opacity}) 1px, transparent 1px)
    `,
  };
});

// Glass Card Style
const glassCardStyle = computed(() => {
  const colors = themeColors.value;
  return {
    background: colors.glass,
    border: `1px solid ${colors.glassBorder}`,
    backdropFilter: "blur(16px)",
  };
});

// Icon Style
const iconStyle = computed(() => {
  return {
    color: themeColors.value.iconColor,
  };
});
</script>

<style scoped>
.blur-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}

.glass-card {
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Aurora Effect */
.aurora {
  position: absolute;
  width: 200%;
  height: 50%;
  filter: blur(60px);
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
  filter: blur(40px);
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 40%;
  height: 60%;
  top: -10%;
  left: -5%;
}

.orb-2 {
  width: 35%;
  height: 50%;
  bottom: -15%;
  right: 5%;
  animation-delay: -7s;
}

.orb-3 {
  width: 30%;
  height: 45%;
  top: 20%;
  right: -10%;
  animation-delay: -14s;
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
    transform: translate(5px, -10px) scale(1.02);
  }
  50% {
    transform: translate(-3px, 5px) scale(0.98);
  }
  75% {
    transform: translate(-8px, -5px) scale(1.01);
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

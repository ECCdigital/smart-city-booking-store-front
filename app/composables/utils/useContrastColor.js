import { computed } from "vue";

export function useContrastColor() {
  const FALLBACK_PRIMARY = "#000000";
  const FALLBACK_SECONDARY = "#000000";
  const FALLBACK_CONTRAST = "#ffffff";

  const readCssVar = (name, fallback) => {
    if (!import.meta.client) return fallback;

    try {
      const root = document?.documentElement;
      if (!root) return fallback;

      const v = getComputedStyle(root).getPropertyValue(name).trim();
      return v || fallback;
    } catch {
      return fallback;
    }
  };

  const primaryColor = ref(FALLBACK_PRIMARY);
  const secondaryColor = ref(FALLBACK_SECONDARY);

  if (import.meta.client) {
    onMounted(() => {
      primaryColor.value = readCssVar("--ui-primary", FALLBACK_PRIMARY);
      secondaryColor.value = readCssVar("--ui-secondary", FALLBACK_SECONDARY);
    });
  }

  const contrastToPrimary = computed(() =>
    getContrastColor(primaryColor.value)
  );
  const contrastToSecondary = computed(() =>
    getContrastColor(secondaryColor.value)
  );

  function getContrastColor(hex) {
    if (hex && hex.startsWith("#") && hex.length >= 7) {
      const c = hex.slice(1, 7);
      const rgb = parseInt(c, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      return luma > 180 ? "#000000" : "#ffffff";
    }
    return FALLBACK_CONTRAST;
  }

  const lighterColor = computed(() =>
    getLighterColor(primaryColor.value, secondaryColor.value)
  );
  const darkerColor = computed(() =>
    getDarkerColor(primaryColor.value, secondaryColor.value)
  );

  function hexToRgb(hex) {
    const cleanHex = hex.replace("#", "");
    const bigint = parseInt(cleanHex, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function getLuminance(hexColor) {
    const { r, g, b } = hexToRgb(hexColor);
    const [R, G, B] = [r, g, b].map((v) => {
      const val = v / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function getLighterColor(color1, color2) {
    if (!color1 || !color2) return color1 || color2 || FALLBACK_PRIMARY;
    return getLuminance(color1) > getLuminance(color2) ? color1 : color2;
  }

  function getDarkerColor(color1, color2) {
    if (!color1 || !color2) return color1 || color2 || FALLBACK_PRIMARY;
    return getLuminance(color1) < getLuminance(color2) ? color1 : color2;
  }

  return { contrastToPrimary, contrastToSecondary, lighterColor, darkerColor };
}

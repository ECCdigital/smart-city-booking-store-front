<template>
  <UTooltip :text="actionLabel">
    <UButton
      :icon="stateIcon"
      variant="ghost"
      color="neutral"
      class="flex h-12 items-center px-2 sm:px-3 hover:bg-current/15! active:bg-current/20!"
      :style="{ color: contrastToPrimary }"
      :aria-label="t('colorMode.toggle')"
      :aria-pressed="isDark"
      @click="toggle"
    />
  </UTooltip>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToPrimary } = useContrastColor();
const { t } = useI18n();

// The only holder of the colour mode is colorMode.preference -- no local ref, no
// second storage next to it. The settings switch writes the same value.
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// The icon shows the current state: a sun in light mode, a moon in dark mode.
// The tooltip announces the action a click performs. The accessible name is
// stable ("colour mode"); aria-pressed carries the state.
const stateIcon = computed(() =>
  isDark.value ? "i-lucide-moon" : "i-lucide-sun",
);
const actionLabel = computed(() =>
  isDark.value ? t("colorMode.switchToLight") : t("colorMode.switchToDark"),
);

function toggle() {
  // Reading colorMode.value rather than .preference resolves "system" to the mode
  // actually on screen, so the first click always flips what the visitor sees.
  colorMode.preference = isDark.value ? "light" : "dark";
}
</script>

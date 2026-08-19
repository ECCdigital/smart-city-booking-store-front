<template>
  <UTooltip :text="actionLabel">
    <UButton
      :icon="actionIcon"
      variant="ghost"
      color="neutral"
      class="flex h-12 items-center px-3 cursor-pointer hover:!bg-current/15 active:!bg-current/20"
      :style="{ color: contrastToSecondary }"
      :aria-label="t('colorMode.toggle')"
      :aria-pressed="isDark"
      @click="toggle"
    />
  </UTooltip>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToSecondary } = useContrastColor();
const { t } = useI18n();

// The only holder of the colour mode is colorMode.preference -- no local ref, no
// second storage next to it. The settings switch writes the same value.
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

// Icon and tooltip announce the action, not the current state: in light mode
// the button shows a moon and the tooltip reads "dark theme", because that is
// where a click leads. The accessible name is stable ("colour mode");
// aria-pressed carries the state.
const actionIcon = computed(() =>
  isDark.value ? "i-lucide-sun" : "i-lucide-moon",
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

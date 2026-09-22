<template>
  <UTooltip :text="targetName">
    <UButton
      variant="ghost"
      color="neutral"
      class="flex h-12 items-center px-2 sm:px-3 font-bold cursor-pointer hover:bg-current/15! active:bg-current/20!"
      :style="{ color: contrastToSecondary }"
      :aria-label="t('language.switchTo', { language: targetName })"
      @click="toggle"
    >
      {{ targetLocale.toUpperCase() }}
    </UButton>
  </UTooltip>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToSecondary } = useContrastColor();
const { t, locale, locales } = useI18n();

// Like the colour mode button next to it, the label announces the action rather
// than the state: in German the button reads "EN", because that is where a click
// leads. The accessible name spells the same thing out.
const targetLocale = computed(() => (locale.value === "en" ? "de" : "en"));

const targetName = computed(
  () =>
    locales.value.find((l) => l.code === targetLocale.value)?.name ??
    targetLocale.value.toUpperCase(),
);

function toggle() {
  // The switch itself -- setLocale plus the localised route -- comes with its own
  // ticket. Until then the button only reports where it would go.
  console.log(
    `[LanguageToggle] would switch locale to "${targetLocale.value}"`,
  );
}
</script>

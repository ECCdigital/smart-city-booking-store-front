<template>
  <UTooltip :text="targetName">
    <UButton
      variant="ghost"
      color="neutral"
      class="flex h-12 items-center px-2 sm:px-3 font-bold hover:bg-current/15! active:bg-current/20!"
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
const { t, locale, locales, setLocale } = useI18n();

const targetLocale = computed(() => (locale.value === "en" ? "de" : "en"));

const targetName = computed(
  () =>
    locales.value.find((l) => l.code === targetLocale.value)?.name ??
    targetLocale.value.toUpperCase(),
);

// `setLocale` is the whole switch: it writes the `i18n_redirected` cookie the
// browser-language detection reads on the next visit and navigates to the same
// page under the new locale -- German has no prefix, English gets `/en`.
async function toggle() {
  await setLocale(targetLocale.value);
}
</script>

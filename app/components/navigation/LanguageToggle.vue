<template>
  <UTooltip :text="actionLabel">
    <UButton
      variant="ghost"
      color="neutral"
      class="flex h-12 items-center px-2 sm:px-3 font-bold hover:bg-current/15! active:bg-current/20!"
      :style="{ color: contrastToPrimary }"
      :aria-label="actionLabel"
      @click="toggle"
    >
      {{ locale.toUpperCase() }}
    </UButton>
  </UTooltip>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToPrimary } = useContrastColor();
const { t, locale, locales, setLocale } = useI18n();

const targetLocale = computed(() => (locale.value === "en" ? "de" : "en"));

const targetName = computed(
  () =>
    locales.value.find((l) => l.code === targetLocale.value)?.name ??
    targetLocale.value.toUpperCase(),
);

// The label shows the current state ("DE" while German is active); tooltip and
// accessible name announce the action a click performs.
const actionLabel = computed(() =>
  t("language.switchTo", { language: targetName.value }),
);

// `setLocale` is the whole switch: it writes the `i18n_redirected` cookie the
// browser-language detection reads on the next visit and re-renders the page
// in place -- both languages share one URL (`no_prefix`).
async function toggle() {
  await setLocale(targetLocale.value);
}
</script>

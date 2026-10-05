<template>
  <div>
    <div class="mb-5">
      <h3 class="text-xl font-bold mb-2">
        {{ $t("account.appearanceTitle") }}
      </h3>
      <p class="mt-2 mb-5">
        {{ $t("account.appearanceDescription") }}
      </p>

      <div class="md:flex items-center">
        <div class="basis-1/5 text-sm font-semibold">
          {{ $t("account.appearanceColorScheme") }}
        </div>
        <UFieldGroup class="flex justify-center">
          <UButton
            :color="isDark ? 'primary' : 'neutral'"
            :variant="isDark ? 'solid' : 'soft'"
            :label="$t('account.appearanceDark')"
            icon="i-lucide-moon"
            :class="colorButtonClasses"
            @click="() => (isDark = true)"
          />
          <UButton
            :color="!isDark ? 'primary' : 'neutral'"
            :variant="!isDark ? 'solid' : 'soft'"
            :label="$t('account.appearanceLight')"
            icon="i-lucide-sun"
            :class="colorButtonClasses"
            @click="() => (isDark = false)"
          />
        </UFieldGroup>
      </div>
    </div>
    <div>
      <h3 class="text-xl font-bold mb-2">
        {{ $t("account.appearanceLanguage") }}
      </h3>
      <div class="md:flex items-center">
        <div class="basis-1/5 text-sm font-semibold">
          {{ $t("account.appearanceDisplayLanguage") }}
        </div>
        <USelect
          v-model="language"
          :items="languageOptions"
          :class="languageSelectClasses"
          :ui="{
            itemLabel: 'text-lg md:text-md',
          }"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
const { t, te, locale, locales, setLocale } = useI18n();

const colorMode = useColorMode();
const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(_isDark) {
    colorMode.preference = _isDark ? "dark" : "light";
  },
});
const colorButtonClasses = ref(
  "w-[50%] md:w-30 h-12 sm:h-8 text-lg sm:text-md flex justify-center items-center",
);

// The select switches the language, the same way the button in the navigation
// bar does: `setLocale` writes the `i18n_redirected` cookie and re-renders the
// page in place.
const language = computed({
  get: () => locale.value,
  set: (code) => {
    setLocale(code);
  },
});

const languageOptions = computed(() =>
  locales.value.map((entry) => {
    const key = `account.languages.${entry.code}`;
    return {
      label: te(key) ? t(key) : entry.name || entry.code,
      value: entry.code,
    };
  }),
);
const languageSelectClasses = ref(
  "w-full md:w-60 h-12 sm:h-8 text-lg sm:text-md",
);
</script>
<style scoped></style>

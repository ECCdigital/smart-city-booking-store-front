<template>
  <div>
    <div class="mb-5">
      <h3 class="text-xl font-bold mb-2">Optische Darstellung</h3>
      <div class="md:flex items-center">
        <div class="basis-1/5 text-sm font-semibold">Farbgestaltung</div>
        <UFieldGroup class="flex justify-center">
          <UButton
            :color="isDark ? 'primary' : 'neutral'"
            :variant="isDark ? 'solid' : 'soft'"
            label="Dunkel"
            icon="i-lucide-moon"
            :class="colorButtonClasses"
            @click="() => (isDark = true)"
          />
          <UButton
            :color="!isDark ? 'primary' : 'neutral'"
            :variant="!isDark ? 'solid' : 'soft'"
            label="Hell"
            icon="i-lucide-sun"
            :class="colorButtonClasses"
            @click="() => (isDark = false)"
          />
        </UFieldGroup>
      </div>
    </div>
    <div>
      <h3 class="text-xl font-bold mb-2">Sprache</h3>
      <div class="md:flex items-center">
        <div class="basis-1/5 text-sm font-semibold">Anzeigesprache</div>
        <UTooltip text="Diese Funktion ist derzeit nicht verfügbar.">
          <USelect
            v-model="language"
            :items="languageOptions"
            :class="languageSelectClasses"
            :ui="{
              itemLabel: 'text-lg md:text-md',
            }"
            disabled
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
<script setup>
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

const language = ref("de");
const languageOptions = [
  { label: "Deutsch", value: "de" },
  { label: "Englisch", value: "en" },
  { label: "Französisch", value: "fr" },
  { label: "Spanisch", value: "es" },
];
const languageSelectClasses = ref(
  "w-full md:w-60 h-12 sm:h-8 text-lg sm:text-md",
);
</script>
<style scoped></style>

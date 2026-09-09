<script setup>
import { useHeroMode } from "~/composables/useHeroMode";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

useHead({
  link: [{ rel: "preload", href: "/api/theme/logo", as: "image" }],
});

/**
 * The two Heroes the storefront knows. A page names the mode, never the sizes -
 * the numbers here are the ones the pages used to carry one by one.
 */
const heroPresets = {
  home: {
    height: "lg",
    titleClass: "text-2xl",
    subtitleClass: "text-xl md:text-5xl",
  },
  compact: {
    height: "sm",
    titleClass: "text-sm md:text-md",
    subtitleClass: "text-xl md:text-3xl",
  },
};

// The mobile Hero is short in both modes; only the desktop height follows it.
const mobileHeight = "sm";

const { data: hero } = await useFetch("/api/theme/hero");
const colorMode = useColorMode();
const mode = useHeroMode();
const { isGreaterThanMd } = useBreakpointCheck();

const preset = computed(() => heroPresets[mode.value]);
const height = computed(() =>
  isGreaterThanMd.value ? preset.value.height : mobileHeight,
);

const title = computed(() => hero.value?.title);
const subtitle = computed(() => hero.value?.subtitle);
</script>

<template>
  <HeroBackground
    variant="poly"
    :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
    :height="height"
    :fade-bottom="false"
    class="py-10 md:py-15 justify-between z-0 pb-30 lg:pb-15"
  >
    <!-- Surface is full-bleed, content sits inside the page container -->
    <div class="container h-full">
      <div class="md:flex justify-between md:h-full">
        <div class="md:hidden mb-5 flex justify-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[5vh] dark:invert dark:hue-rotate-180"
          >
        </div>
        <div class="grid content-center max-w-220px text-center md:text-left">
          <p class="text-primary font-bold" :class="preset.titleClass">
            {{ title }}
          </p>
          <p
            class="text-black dark:text-white font-bold"
            :class="preset.subtitleClass"
          >
            {{ subtitle }}
          </p>
        </div>
        <div class="hidden md:block" style="flex: 1; min-width: 15vw" />
        <div class="grid content-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[7vh] hidden md:block dark:invert dark:hue-rotate-180"
          >
        </div>
      </div>
    </div>
  </HeroBackground>
</template>

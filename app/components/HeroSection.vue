<script setup>
import { useHeroConfig } from "~/composables/useHeroConfig";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

useHead({
  link: [{ rel: "preload", href: "/api/theme/logo", as: "image" }],
});

const { data: hero } = await useFetch("/api/theme/hero");
const colorMode = useColorMode();
const config = useHeroConfig();
const { isGreaterThanMd } = useBreakpointCheck();

const title = computed(() => config.value.staticTitle ?? hero.value?.title);
const subtitle = computed(
    () => config.value.staticSubtitle ?? hero.value?.subtitle,
);
</script>

<template>
  <HeroBackground
      variant="poly"
      :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
      :height="
      !isGreaterThanMd && config.mobileHeight
        ? config.mobileHeight
        : config.height
    "
      :fade-bottom="false"
      class="px-10 py-10 md:py-15 justify-between z-0 pb-50 md:pb-30 lg:pb-15"
      :class="{ 'hidden md:block': !config.showOnMobile }"
  >
    <div class="md:flex justify-between md:h-full">
      <div
          v-if="config.showOnMobile"
          class="md:hidden mb-5 flex justify-center"
      >
        <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[5vh] dark:invert dark:hue-rotate-180"
        >
      </div>
      <div class="grid content-center max-w-220px text-center md:text-left">
        <p class="text-primary font-bold" :class="config.titleClass">
          {{ title }}
        </p>
        <p
            class="text-black dark:text-white font-bold"
            :class="config.subtitleClass"
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
  </HeroBackground>
</template>
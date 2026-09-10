<template>
  <div>
    <div
      v-if="isLargeVersion"
      class="hidden lg:flex items-center justify-center"
    >
      <div class="max-w-md text-center">
        <div class="mb-10 grid space-y-2 content-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[7vh] mx-auto dark:invert dark:hue-rotate-180"
          />
          <p class="text-primary font-bold text-xl" :class="config.titleClass">
            {{ title }}
          </p>
        </div>
      </div>
    </div>

    <div v-else>
      <img
        :src="`/api/theme/logo`"
        alt="logo"
        class="max-h-[7vh] mb-6 dark:invert dark:hue-rotate-180"
      />
      <p
        class="text-primary font-bold text-xl text-center mb-6"
        :class="config.titleClass"
      >
        {{ title }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { useHeroConfig } from "~/composables/useHeroConfig.ts";
import { computed } from "vue";

defineProps({
  isLargeVersion: {
    type: Boolean,
    default: false,
  },
});

const { data: hero } = await useFetch("/api/theme/hero");

const config = useHeroConfig();
const title = computed(() => config.value.staticTitle ?? hero.value?.title);
</script>

<style scoped></style>

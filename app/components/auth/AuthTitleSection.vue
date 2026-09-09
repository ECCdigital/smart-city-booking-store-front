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
          <p class="text-primary font-bold text-xl">
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
      <p class="text-primary font-bold text-xl text-center mb-6">
        {{ title }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";

const props = defineProps({
  isLargeVersion: {
    type: Boolean,
    default: false,
  },
});

const { data: hero } = await useFetch("/api/theme/hero");

const title = computed(() => hero.value?.title);
</script>

<style scoped></style>

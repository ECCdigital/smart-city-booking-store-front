<template>
  <div>
    <div
      v-if="isLargeVersion"
      class="hidden lg:flex items-center justify-center"
    >
      <div class="max-w-md text-center">
        <div class="mb-10 grid space-y-2 content-center justify-items-center">
          <ThemeLogo
            v-if="logo"
            :image="logo"
            :alt="title"
            max-height="sm"
            invert-in-dark-mode
          />
          <p class="text-primary font-bold text-xl">
            {{ title }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center">
      <ThemeLogo
        v-if="logo"
        :image="logo"
        :alt="title"
        max-height="sm"
        invert-in-dark-mode
        class="mb-6"
      />
      <p class="text-primary font-bold text-xl text-center mb-6">
        {{ title }}
      </p>
    </div>
  </div>
</template>
<script setup>
/**
 * The title above the auth forms: the logo and the Portal Name, both from
 * the Theme View the page already holds — nothing is fetched here. Without
 * a logo the Portal Name stands alone.
 */
defineProps({
  isLargeVersion: {
    type: Boolean,
    default: false,
  },
});

const { data: theme } = await useThemeBundle();
const logo = computed(() => theme.value?.logo ?? null);
const title = useSiteName();
</script>

<style scoped></style>

<script setup></script>

<template>
  <UCard
    variant="soft"
    class="w-full max-w-md rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg"
  >
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon
          size="32"
          name="i-lucide-loader-circle"
          class="animate-spin text-primary"
        />

        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("emailVerification.progress.heading") }}
        </h2>
      </div>
    </template>

    <p class="mb-6 text-muted">
      {{ $t("emailVerification.progress.description") }}
    </p>

  </UCard>
</template>

<style scoped></style>

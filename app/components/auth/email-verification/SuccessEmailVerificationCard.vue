<script setup>

</script>

<template>

  <UCard
      variant="soft"
      class="w-full max-w-md rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg"
  >
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon
            size="32"
            name="i-lucide-circle-check-big"
            class="text-success"
        />
        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("emailVerification.success.heading") }}
        </h2>
      </div>
    </template>

    <p class="mb-6 text-muted">
      {{ $t("emailVerification.success.description") }}
    </p>

    <div class="flex flex-col gap-3 w-full">
      <UButton color="primary" block to="/">
        {{ $t("emailVerification.success.toLogin") }}
      </UButton>

    </div>
  </UCard>

</template>

<style scoped>

</style>
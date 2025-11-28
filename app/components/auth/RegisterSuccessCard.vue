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
          {{ $t("register.success.heading") }}
        </h2>
      </div>
    </template>

    <p class="l mb-6">
      {{ $t("register.success.description") }}
    </p>

    <p class="text-sm text-muted mb-6">
      {{ $t("register.success.spamHint") }}
    </p>

    <div class="flex flex-col gap-3 w-full">
      <UButton color="primary" block to="/">
        {{ $t("register.success.toHome") }}
      </UButton>

      <UButton block variant="soft" to="/login">
        {{ $t("register.success.toLogin") }}
      </UButton>
    </div>
  </UCard>
</template>

<style scoped></style>

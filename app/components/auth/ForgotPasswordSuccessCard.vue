<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon
          size="32"
          name="i-lucide-circle-check-big"
          class="text-success"
        />

        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("forgotPassword.success.heading") }}
        </h2>
      </div>
    </template>

    <p class="mb-6">
      {{ $t("forgotPassword.success.description") }}
    </p>

    <p class="text-sm text-muted mb-6">
      {{ $t("forgotPassword.success.spamHint") }}
    </p>

    <UButton color="primary" block to="/login">
      {{ $t("common.backToLogin") }}
    </UButton>
  </UCard>
</template>

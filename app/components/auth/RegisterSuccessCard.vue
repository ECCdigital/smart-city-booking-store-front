<script setup>
defineProps({
  // The login page, carrying the return target of the signup.
  loginTo: {
    type: String,
    default: "/login",
  },
  resending: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["resend"]);
</script>

<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon
          size="32"
          name="i-lucide-circle-check-big"
          class="text-success"
        />

        <h1 class="text-2xl font-semibold mb-2">
          {{ $t("register.success.heading") }}
        </h1>
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

      <UButton block variant="soft" :to="loginTo">
        {{ $t("register.success.toLogin") }}
      </UButton>

      <UButton
        block
        variant="ghost"
        :loading="resending"
        @click="$emit('resend')"
      >
        {{ $t("emailVerification.resendLink") }}
      </UButton>
    </div>
  </UCard>
</template>

<style scoped></style>

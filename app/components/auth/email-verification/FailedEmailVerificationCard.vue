<script setup>
defineProps({
  errorType: {
    type: Object,
    default: null,
  },
});

const t = useI18n().t;

const errorMessages = {
  invalidToken: t("emailVerification.error.invalidToken"),
  userNotFound: t("emailVerification.error.userNotFound"),
  alreadyVerified: t("emailVerification.error.alreadyVerified"),
  default: t("emailVerification.error.default"),
};
</script>

<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon size="32" name="i-lucide-circle-x" class="text-error" />
        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("emailVerification.error.heading") }}
        </h2>
      </div>
    </template>

    <p class="mb-6 text-muted">
      {{ errorMessages[errorType] }}
    </p>
  </UCard>
</template>

<style scoped></style>

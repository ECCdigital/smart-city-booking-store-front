<script setup>
defineProps({
  errorType: {
    type: Object,
    default: null,
  },
});

const t = useI18n().t;

const errorMessages = {
  invalidToken: t("cardLinkVerification.error.invalidToken"),
  userNotFound: t("cardLinkVerification.error.userNotFound"),
  alreadyVerified: t("cardLinkVerification.error.alreadyVerified"),
  default: t("cardLinkVerification.error.default"),
};

const emit = defineEmits(["backToLogin"]);
</script>

<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon size="32" name="i-lucide-circle-x" class="text-error" />
        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("cardLinkVerification.error.heading") }}
        </h2>
      </div>
    </template>

    <p class="mb-6 text-muted">
      {{ errorMessages[errorType] }}
    </p>

    <div class=" w-full">

      <UButton
      color="neutral"
      variant="outline"
      block
      to="/login"
      icon="i-lucide-arrow-left"
      >
      {{ $t("common.backToLogin") }}
      </UButton>
    </div>


  </UCard>
</template>

<style scoped></style>

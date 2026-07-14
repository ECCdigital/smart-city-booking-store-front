<script setup>
defineProps({
  email: {
    type: String,
    required: false,
    default: "",
  },
});

const emit = defineEmits(["startVerification"]);
</script>

<template>
  <UCard
    variant="soft"
    class="w-full max-w-md rounded-xl bg-surface-raised/30 backdrop-blur-lg"
  >
    <template #header>
      <div class="flex flex-col justify-center items-center">
        <UIcon size="32" name="i-lucide-mail-check" class="text-primary" />
        <h2 class="text-2xl font-semibold mb-2">
          {{ $t("emailVerification.action.heading") }}
        </h2>
      </div>
    </template>

    <p class="mb-6 text-muted">
      {{ $t("emailVerification.action.description") }}
    </p>

    <p v-if="email" class="mb-4 text-sm text-gray-500 dark:text-gray-400">
      {{ $t("emailVerification.action.emailHint") }}:
      <span class="font-medium break-all">{{ email }}</span>
    </p>

    <div class="flex flex-col gap-3 w-full">
      <UButton color="primary" block @click="emit('startVerification')">
        {{ $t("emailVerification.action.startVerification") }}
      </UButton>
    </div>
  </UCard>
</template>

<style scoped></style>

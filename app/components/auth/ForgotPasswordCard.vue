<template>
  <UCard
    variant="soft"
    class="w-full max-w-md rounded-xl bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg"
  >
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ $t("forgotPassword.title") }}
      </h2>

      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("forgotPassword.description") }}
      </p>
    </template>

    <UForm :state="userData" @submit="submitForm" class="flex flex-col gap-2">
      <UFormField :label="$t('common.email')" required>
        <UInput
          v-model="userData.email"
          type="email"
          placeholder="name@example.com"
          class="w-full"
          required
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ $t("forgotPassword.submit") }}
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("forgotPassword.remembered") }}
        <NuxtLink to="/login" class="text-primary-500 hover:underline">
          {{ $t("common.login") }}
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const userData = defineModel("userData", {
  type: Object,
  required: true,
});

const emit = defineEmits(["submit"]);

function submitForm() {
  emit("submit");
}
</script>

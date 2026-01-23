<template>
  <UCard
    variant="soft"
    class="w-full max-w-md rounded-xl bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg"
  >
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ $t("login.title") }}
      </h2>
    </template>

    <UForm :state="userData" @submit="submitForm" class="flex flex-col gap-2">
      <UFormField :label="$t('common.email')" required>
        <UInput
          v-model="userData.id"
          type="email"
          placeholder="name@example.com"
          class="w-full"
          required
        />
      </UFormField>

      <UFormField :label="$t('common.password')" required>
        <UInput
          v-model="userData.password"
          :type="show ? 'text' : 'password'"
          :ui="{ trailing: 'pe-1' }"
          placeholder="••••••••"
          class="w-full"
          required
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="show ? 'Hide password' : 'Show password'"
              :aria-pressed="show"
              aria-controls="password"
              @click="show = !show"
            /> </template
        ></UInput>
      </UFormField>

      <NuxtLink
        to="/password/forgot"
        class="text-sm text-primary-600 hover:underline"
      >
        {{ $t("login.forgotPassword") }}
      </NuxtLink>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ $t("common.login") }}
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("login.noAccount") }}
        <NuxtLink to="/register" class="text-primary-500 hover:underline">
          {{ $t("login.registerHere") }}
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const userData = defineModel("userData", {
  id: "",
  password: "",
});

const emit = defineEmits(["submit"]);

const show = ref(false);

function submitForm() {
  emit("submit");
}
</script>

<style scoped></style>

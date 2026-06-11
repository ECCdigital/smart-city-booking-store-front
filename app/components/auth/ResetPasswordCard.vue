<template>
  <UCard
    variant="soft"
    class="w-full max-w-md bg-white/30 dark:bg-gray-800/40 backdrop-blur-md"
  >
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ $t("resetPassword.title") }}
      </h2>

      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("resetPassword.description") }}
      </p>
    </template>

    <UForm :state="userData" class="flex flex-col gap-2" @submit="submitForm">
      <PasswordInput
        v-model="userData.password"
        :label="$t('common.newPassword')"
        is-required
        input-style-classes="w-full"
      />
      <PasswordProgress :password="userData.password" />


      <PasswordInput
        v-model="userData.passwordRepeat"
        :label="$t('common.repeatPassword')"
        is-required
        input-style-classes="w-full"
      />

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ $t("resetPassword.submit") }}
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("resetPassword.backToLogin") }}
        <NuxtLink to="/login" class="text-primary-500 hover:underline">
          {{ $t("common.login") }}
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>

<script setup>
import PasswordInput from "~/components/auth/PasswordInput.vue";
import PasswordProgress from "~/components/auth/PasswordProgress.vue";

//const t = useI18n().t;

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const userData = defineModel("userData", {
  password: "",
  passwordRepeat: "",
});

const emit = defineEmits(["submit"]);

function submitForm() {
  emit("submit");
}
</script>

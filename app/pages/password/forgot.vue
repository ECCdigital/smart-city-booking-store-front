<script setup lang="ts">
import { ref } from "vue";
import ForgotPasswordCard from "~/components/auth/ForgotPasswordCard.vue";
import ForgotPasswordSuccessCard from "~/components/auth/ForgotPasswordSuccessCard.vue";
import { useAuth } from "~/composables/auth/useAuth";

const form = ref({
  email: "",
});

const loading = ref(false);
const success = ref(false);
const { forgotPassword } = useAuth();
const notification = useNotification();
const { t } = useI18n();
usePageTitle(() => t("meta.pages.forgotPassword"));
const config = useRuntimeConfig();
const localePath = useLocalePath();

const handleForgotPassword = async () => {
  loading.value = true;
  try {
    const resetUrl = `${config.public.userBaseUrl}${localePath("/password/reset")}`;
    await forgotPassword(form.value.email, resetUrl);
    success.value = true;
  } catch {
    notification.error(
      t("notifications.forgotPasswordError.message"),
      t("notifications.forgotPasswordError.title"),
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">
          {{ $t("forgotPassword.headline") }}
        </h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <ForgotPasswordSuccessCard
        v-if="success"
        class="shadow-2xl/50"
      />
      <ForgotPasswordCard
        v-else
        v-model:user-data="form"
        class="shadow-2xl/50"
        :loading="loading"
        @submit="handleForgotPassword"
      />
    </div>
  </PageBackground>
</template>

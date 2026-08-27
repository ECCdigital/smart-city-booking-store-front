<script setup lang="ts">
import { ref } from "vue";
import ForgotPasswordCard from "~/components/auth/ForgotPasswordCard.vue";
import ForgotPasswordSuccessCard from "~/components/auth/ForgotPasswordSuccessCard.vue";
import { useAuth } from "~/composables/auth/useAuth";
import AuthTitleSection from "~/components/auth/AuthTitleSection.vue";

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
    <AuthTitleSection
      is-large-version
      class="hidden lg:flex w-3/5 items-center justify-center"
    />

    <div class="flex flex-col w-full lg:w-2/5 items-center justify-center p-6">
      <AuthTitleSection class="lg:hidden" />

      <ForgotPasswordSuccessCard v-if="success" class="shadow-2xl/50" />
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

<script setup lang="ts">
import { ref } from "vue";
import ForgotPasswordCard from "~/components/auth/ForgotPasswordCard.vue";
import ForgotPasswordSuccessCard from "~/components/auth/ForgotPasswordSuccessCard.vue";
import { useAuth } from "~/composables/auth/useAuth";
import { storefrontUrl } from "~~/shared/utils/storefrontUrl";
import { rateLimitWait } from "~~/shared/utils/retryAfter";

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
    const resetUrl = storefrontUrl(
      config.public.userBaseUrl,
      localePath("/password/reset"),
    );
    await forgotPassword(form.value.email, resetUrl);
    success.value = true;
  } catch (error) {
    const key = rateLimitWait(error)
      ? "errors.page.tooManyRequests"
      : "notifications.forgotPasswordError";
    notification.error(t(`${key}.message`), t(`${key}.title`));
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageBackground>
    <div class="flex w-full items-center justify-center p-6">
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

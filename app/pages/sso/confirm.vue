<script setup>
import { useAuthStore } from "~~/stores/auth";
import SSOConfirmCard from "~/components/auth/SSOConfirmCard.vue";

definePageMeta({
  layout: "default",
});

const { t } = useI18n();
const notification = useNotification();
const authStore = useAuthStore();

const loading = ref(false);
const userInfo = ref(null);
const hasError = ref(false);

const pendingRedirect = useCookie("kc-pending-redirect");

onMounted(async () => {
  try {
    const data = await $fetch("/api/auth/sso/pending-user");
    userInfo.value = data;
  } catch {
    hasError.value = true;
  }
});

const handleConfirm = async () => {
  loading.value = true;
  try {
    await $fetch("/api/auth/sso/confirm", {
      method: "POST",
    });

    const valid = await authStore.validateAuth(true);

    if (!valid) {
      throw new Error("Auth validation failed after confirm");
    }

    notification.success(
      `${t("notifications.loginSuccess.message")}, ${
        userInfo.value?.firstName || ""
      }!`,
      t("notifications.loginSuccess.title")
    );

    const redirect = pendingRedirect.value || "/";
    pendingRedirect.value = null;

    await navigateTo(redirect);
  } catch (err) {
    console.error("SSO confirm error:", err);
    notification.error(
      t("notifications.loginError.message"),
      t("notifications.loginError.title")
    );
    hasError.value = true;
  } finally {
    loading.value = false;
  }
};

const handleChangeUser = async () => {
  const redirect = pendingRedirect.value || "/";
  window.location.href = `/api/auth/sso/change-user?redirect=${encodeURIComponent(
    redirect
  )}`;
};

const handleBack = () => {
  navigateTo("/login");
};
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center"></div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <SSOConfirmCard
        class="shadow-2xl/50"
        :user-info="userInfo"
        :has-error="hasError"
        :loading="loading"
        @confirm="handleConfirm"
        @change-user="handleChangeUser"
        @back="handleBack"
      />
    </div>
  </PageBackground>
</template>

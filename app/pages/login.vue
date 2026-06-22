<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import LoginCard from "~/components/auth/LoginCard.vue";
import { useAuthStore } from "~~/stores/auth.js";
import { useInstanceStore } from "~~/stores/instance";

definePageMeta({
  layout: "default",
});

const t = useI18n().t;
usePageTitle(() => t("meta.pages.login"));
const route = useRoute();

const form = ref({ id: "", password: "" });
const loading = ref(false);

const { login } = useAuth();
const notification = useNotification();
const authStore = useAuthStore();
const instanceStore = useInstanceStore();

const user = computed(() => authStore.getUser);
const userName = computed(() => user.value?.firstName || "");
const ssoEnabled = computed(() => instanceStore.ssoEnabled);
const ssoError = computed(() => route.query.error as string | undefined);

const handleLogin = async () => {
  loading.value = true;
  try {
    await login(form.value);
    notification.success(
        t("notifications.loginSuccess.message") + ", " + userName.value + "!",
        t("notifications.loginSuccess.title")
    );
    const redirect = route.query.redirect;
    if (redirect && typeof redirect === "string") {
      await navigateTo(redirect);
    } else {
      await navigateTo("/");
    }
  } catch (err) {
    notification.error(
        t("notifications.loginError.message"),
        t("notifications.loginError.title")
    );
    console.error("Login failed:", err);
  } finally {
    loading.value = false;
  }
};

const handleSsoLogin = () => {
  const redirect = (route.query.redirect as string) || "/";
  window.location.href = `/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`;
};
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">Willkommen zurück!</h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <LoginCard
          v-model:user-data="form"
          class="shadow-2xl/50"
          :loading="loading"
          :sso-enabled="ssoEnabled"
          :sso-error="ssoError"
          @submit="handleLogin"
          @sso-login="handleSsoLogin"
      />
    </div>
  </PageBackground>
</template>
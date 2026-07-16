<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import LoginCard from "~/components/auth/LoginCard.vue";
import { useAuthStore } from "~~/stores/auth.js";
import { useInstanceStore } from "~~/stores/instance";
import { getSafeRedirectPath } from "~/utils/safeRedirect";
import { useHeroConfig } from "~/composables/useHeroConfig";

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
    await authStore.validateAuth(true);
    notification.success(
      t("notifications.loginSuccess.message") + ", " + userName.value + "!",
      t("notifications.loginSuccess.title"),
    );
    const redirect = getSafeRedirectPath(route.query.redirect);
    await navigateTo(redirect);
  } catch (err) {
    notification.error(
      t("notifications.loginError.message"),
      t("notifications.loginError.title"),
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

const { data: hero } = await useFetch("/api/theme/hero");

const config = useHeroConfig();
const title = computed(() => config.value.staticTitle ?? hero.value?.title);
/*const subtitle = computed(
  () => config.value.staticSubtitle ?? hero.value?.subtitle,
);*/
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="hidden lg:flex w-full lg:w-3/5 items-center justify-center">
      <div class="max-w-md text-center">
        <div class="mb-10 grid space-y-2 content-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[7vh] mx-auto dark:invert dark:hue-rotate-180"
          />
          <p class="text-primary font-bold text-xl" :class="config.titleClass">
            {{ title }}
          </p>
        </div>

        <h1 class="text-black dark:text-white text-4xl font-bold mb-4">
          Willkommen zurück!
        </h1>
      </div>
    </div>

    <div class="flex flex-col w-full lg:w-2/5 items-center justify-center p-6">
      <img
        :src="`/api/theme/logo`"
        alt="logo"
        class="lg:hidden max-h-[7vh] mb-6 dark:invert dark:hue-rotate-180"
      />
      <p
        class="lg:hidden text-primary font-bold text-xl text-center mb-6"
        :class="config.titleClass"
      >
        {{ title }}
      </p>
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

<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import LoginCard from "~/components/auth/LoginCard.vue";
import { useAuthStore } from "~~/stores/auth.js";
import { useInstanceStore } from "~~/stores/instance";
import { useReturnTarget } from "~/composables/auth/useReturnTarget";
import { useRateLimitNotice } from "~/composables/auth/useRateLimitNotice";
import AuthTitleSection from "~/components/auth/AuthTitleSection.vue";

definePageMeta({
  layout: "default",
});

const t = useI18n().t;
usePageTitle(() => t("meta.pages.login"));
const route = useRoute();
const proto = useLoginPrototype();

const form = ref({ id: "", password: "" });
const loading = ref(false);

const { login } = useAuth();
const notification = useNotification();
const authStore = useAuthStore();
const instanceStore = useInstanceStore();
const { target: returnTarget, follow: followReturnTarget } = useReturnTarget();
const { notifyRateLimited } = useRateLimitNotice();

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
    await followReturnTarget();
  } catch (err) {
    if (!notifyRateLimited(err)) {
      notification.error(
        t("notifications.loginError.message"),
        t("notifications.loginError.title"),
      );
    }
    console.error("Login failed:", err);
  } finally {
    loading.value = false;
  }
};

const handleSsoLogin = () => {
  const redirect = returnTarget.value || "/";
  window.location.href = `/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`;
};
</script>

<template>
  <PageBackground>
    <!-- PROTOTYPE #513: B und D stellen die Karte mittig, 0, A und C wie heute -->
    <template v-if="proto.variant.value === 'B' || proto.variant.value === 'D'">
      <div class="flex flex-col w-full min-h-screen">
        <div
          v-if="proto.variant.value === 'D'"
          class="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-sm px-6 py-3"
        >
          <AuthTitleSection placement="band" />
        </div>
        <div class="flex flex-1 items-center justify-center p-6">
          <LoginCard
            v-model:user-data="form"
            class="shadow-2xl/50"
            :loading="loading"
            :sso-enabled="ssoEnabled"
            :sso-error="ssoError"
            :return-target="returnTarget ?? undefined"
            @submit="handleLogin"
            @sso-login="handleSsoLogin"
          >
            <template v-if="proto.variant.value === 'B'" #title>
              <AuthTitleSection placement="card" />
            </template>
          </LoginCard>
        </div>
      </div>
    </template>

    <template v-else>
      <AuthTitleSection
        is-large-version
        class="hidden lg:flex w-3/5 items-center justify-center"
      />

      <div class="flex flex-col w-full lg:w-2/5 items-center justify-center p-6">
        <AuthTitleSection class="lg:hidden" />
        <LoginCard
          v-model:user-data="form"
          class="shadow-2xl/50"
          :loading="loading"
          :sso-enabled="ssoEnabled"
          :sso-error="ssoError"
          :return-target="returnTarget ?? undefined"
          @submit="handleLogin"
          @sso-login="handleSsoLogin"
        />
      </div>
    </template>
  </PageBackground>
</template>

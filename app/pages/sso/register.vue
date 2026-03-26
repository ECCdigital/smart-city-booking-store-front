<script setup>
import {useAuthStore} from "~~/stores/auth.js";

definePageMeta({ layout: "default" });

const { t } = useI18n();
const notification = useNotification();
const loading = ref(false);
const authStore = useAuthStore();

const handleRegister = async () => {
  loading.value = true;
  try {
    const response = await $fetch("/api/auth/sso/register", {
      method: "POST",
    });

    if (response.success) {
      authStore.user = response.data.user;
      authStore.permission = response.data.permissions;
      authStore.tokenValid = true;
      authStore.authChecked = true;

      notification.success(t("notifications.registerSuccess.message"));
      await navigateTo("/");
    }
  } catch (err) {
    notification.error(t("notifications.registerError.message"));
    console.error("SSO register failed:", err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="flex items-center justify-center p-6 w-full">
      <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
        <template #header>
          <h2 class="text-2xl font-semibold text-center">
            {{ t("sso.register.title") }}
          </h2>
        </template>

        <div class="flex flex-col items-center text-center gap-4 py-4">
          <div
              class="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center"
          >
            <UIcon
                name="i-lucide-user-plus"
                class="text-primary-500 text-2xl"
            />
          </div>
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            {{ t("sso.register.description") }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton variant="outline" to="/login">
              {{ t("common.back") }}
            </UButton>
            <UButton
                color="primary"
                :loading="loading"
                @click="handleRegister"
            >
              {{ t("common.register") }}
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </PageBackground>
</template>
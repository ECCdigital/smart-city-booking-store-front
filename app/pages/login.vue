<script setup>
import { ref } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import LoginCard from "~/components/auth/LoginCard.vue";
import { useAuthStore } from "~~/stores/auth.js";

definePageMeta({
  layout: "default",
  name: "login",
});

const t = useI18n().t;

const form = ref({
  id: "",
  password: "",
});

const loading = ref(false);

const { login } = useAuth();

const notification = useNotification();

const authStore = useAuthStore();

const user = computed(() => authStore.getUser);

const userName = computed(() => {
  return user.value?.firstName || "";
});


const handleLogin = async () => {
  loading.value = true;
  try {
    await login(form.value);
    notification.success(
      t("notifications.loginSuccess.message") + ", " + userName.value + "!",
      t("notifications.loginSuccess.title")
    );
    const redirect = useRoute().query.redirect;
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
</script>

<template>
  <div
    class="flex min-h-screen bg-gradient-to-br from-secondary via-secondary to-primary"
  >
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">Willkommen zurück!</h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <LoginCard
        :user-data="form"
        :loading="loading"
        @submit="handleLogin"
        class="shadow-2xl/50"
      />
    </div>
  </div>
</template>

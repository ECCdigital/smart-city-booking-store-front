<script setup>
import { ref } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import LoginCard from "~/components/auth/LoginCard.vue";

definePageMeta({
  layout: "default",
  name: "login",
});

const form = ref({
  id: "",
  password: "",
});

const loading = ref(false);

const { login } = useAuth();

const notification = useNotification()

const handleLogin = async () => {
  loading.value = true;
  try {
    await login(form.value);
    const redirect = useRoute().query.redirect;
    if (redirect && typeof redirect === "string") {
      await navigateTo(redirect);
    } else {
      await navigateTo("/");
    }
  } catch (err) {
    notification.error("Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.");
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

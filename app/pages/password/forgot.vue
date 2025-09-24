<script setup lang="ts">
import { ref } from "vue";
import ForgotPasswordCard from "~/components/auth/ForgotPasswordCard.vue";
import { useAuth } from "~/composables/auth/useAuth";

definePageMeta({
  name: "forgot-password",
});

const form = ref({
  email: "",
});

const loading = ref(false);
const { forgotPassword } = useAuth();

const handleForgotPassword = async () => {
  loading.value = true;
  try {
    await forgotPassword(form.value);
    // Optional: Redirect oder Success-Message
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
        <h1 class="text-4xl font-bold mb-4">
          {{ $t("forgotPassword.headline") }}
        </h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <ForgotPasswordCard
        :user-data="form"
        :loading="loading"
        @submit="handleForgotPassword"
        class="shadow-2xl/50"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ResetPasswordCard from "~/components/auth/ResetPasswordCard.vue";
import { useAuth } from "~/composables/auth/useAuth";

definePageMeta({
  name: "reset-password",
});

const form = ref({
  password: "",
  passwordRepeat: "",
});

const loading = ref(false);
const { resetPassword } = useAuth();

const route = useRoute();

const handleResetPassword = async () => {
  loading.value = true;
  try {
    if (form.value.password !== form.value.passwordRepeat) {
      alert("Die Passwörter stimmen nicht überein!");
      return;
    }

    // Token aus Query oder Route (z. B. /password/reset?token=XYZ)
    const token = route.query.token as string;

    await resetPassword({ token, password: form.value.password });
    await navigateTo("/login");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen bg-gradient-to-br from-secondary via-secondary to-primary">
    <div
      class="hidden lg:flex w-3/5 items-center justify-center text-white"
    >
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">
          {{ $t("resetPassword.headline") }}
        </h1>
      </div>
    </div>

    <div
      class="flex w-full lg:w-2/5 items-center justify-center p-6 "
    >
      <ResetPasswordCard
        :user-data="form"
        :loading="loading"
        @submit="handleResetPassword"

      />
    </div>
  </div>
</template>

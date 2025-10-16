<script setup>
import { ref } from "vue";
import RegisterCard from "~/components/auth/RegisterCard.vue";
import { useAuth } from "~/composables/auth/useAuth";

definePageMeta({
  name: "register",
});

const form = ref({
  name: "",
  email: "",
  password: "",
});

const loading = ref(false);
const { register } = useAuth();

const handleRegister = async () => {
  loading.value = true;
  try {
    await register(form.value);
    await navigateTo("/");
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
          {{ $t("register.welcome") }}
        </h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <RegisterCard
        :user-data="form"
        :loading="loading"
        @submit="handleRegister"
        class="shadow-2xl/50"
      />
    </div>
  </div>
</template>

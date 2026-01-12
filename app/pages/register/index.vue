<script setup>
import { ref } from "vue";
import RegisterCard from "~/components/auth/RegisterCard.vue";
import { useAuth } from "~/composables/auth/useAuth.js";
import RegisterSuccessCard from "~/components/auth/RegisterSuccessCard.vue";

definePageMeta({
  name: "register",
});

const form = ref({
  firstname: "",
  lastname: "",
  company: "",
  email: "",
  password: "",
  passwordRepeat: "",
});

const notification = useNotification();

const t = useI18n().t;

const loading = ref(false);
const { register } = useAuth();

const success = ref(false);

const handleRegister = async () => {
  loading.value = true;
  try {
    await register(form.value);
    success.value = true;
  } catch (err) {
    success.value = false;

    console.log("Register failed:", err.status);

    if (err.status === 409) {
      notification.error(
        t("notifications.registerErrorEmailExists.message"),
        t("notifications.registerErrorEmailExists.title")
      );
    } else {
      notification.error(
        t("notifications.registerError.message"),
        t("notifications.registerError.title")
      );
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">

  <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">
          {{ $t("register.welcome") }}
        </h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <RegisterSuccessCard v-if="success" class="shadow-2xl/50" />
      <RegisterCard
        v-else
        v-model:user-data="form"
        :loading="loading"
        class="shadow-2xl/50"
        @submit="handleRegister"
      />
    </div>
  </PageBackground>
</template>

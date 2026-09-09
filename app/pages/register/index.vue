<script setup>
import { ref } from "vue";
import RegisterCard from "~/components/auth/RegisterCard.vue";
import { useAuth } from "~/composables/auth/useAuth.js";
import RegisterSuccessCard from "~/components/auth/RegisterSuccessCard.vue";
import AuthTitleSection from "~/components/auth/AuthTitleSection.vue";

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
usePageTitle(() => t("meta.pages.register"));

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
        t("notifications.registerErrorEmailExists.title"),
      );
    } else {
      notification.error(
        t("notifications.registerError.message"),
        t("notifications.registerError.title"),
      );
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageBackground>
    <AuthTitleSection
      is-large-version
      class="hidden lg:flex w-3/5 items-center justify-center"
    />

    <div class="flex flex-col w-full lg:w-2/5 items-center justify-center p-6">
      <AuthTitleSection class="lg:hidden" />

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

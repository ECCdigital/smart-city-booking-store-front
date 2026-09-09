<script setup lang="ts">
import { ref } from "vue";
import ResetPasswordCard from "~/components/auth/ResetPasswordCard.vue";
import { useAuth } from "~/composables/auth/useAuth";

const form = ref({
  password: "",
  passwordRepeat: "",
});

const loading = ref(false);
const { resetPassword } = useAuth();
const route = useRoute();
const router = useRouter();
const notification = useNotification();
const { t } = useI18n();
usePageTitle(() => t("meta.pages.resetPassword"));

const token = computed(() => String(route.query.token || ""));
const id = computed(() => String(route.query.id || ""));

onMounted(() => {
  if (!token.value) {
    router.push("/password/forgot");
  }
});

const handleResetPassword = async () => {
  if (form.value.password !== form.value.passwordRepeat) {
    notification.error(
      t("resetPassword.passwordMismatch.message"),
      t("resetPassword.passwordMismatch.title"),
    );
    return;
  }

  loading.value = true;
  try {
    await resetPassword({
      token: token.value,
      password: form.value.password,
      id: id.value || undefined,
    });
    notification.success(
      t("notifications.resetPasswordSuccess.message"),
      t("notifications.resetPasswordSuccess.title"),
    );
    await navigateTo("/login");
  } catch (err) {
    if (err?.statusCode === 400) {
      notification.error(
        t("notifications.resetPasswordInvalidToken.message"),
        t("notifications.resetPasswordInvalidToken.title"),
      );
    } else {
      notification.error(
        t("notifications.resetPasswordError.message"),
        t("notifications.resetPasswordError.title"),
      );
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <PageBackground>
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">
          {{ $t("resetPassword.headline") }}
        </h1>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <ResetPasswordCard
        v-model:user-data="form"
        class="shadow-2xl/50"
        :loading="loading"
        @submit="handleResetPassword"
      />
    </div>
  </PageBackground>
</template>

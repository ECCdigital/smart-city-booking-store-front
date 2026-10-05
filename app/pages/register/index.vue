<script setup>
import { ref } from "vue";
import RegisterCard from "~/components/auth/RegisterCard.vue";
import { useAuth } from "~/composables/auth/useAuth.js";
import RegisterSuccessCard from "~/components/auth/RegisterSuccessCard.vue";
import AuthTitleSection from "~/components/auth/AuthTitleSection.vue";
import { useReturnTarget } from "~/composables/auth/useReturnTarget";
import { useRateLimitNotice } from "~/composables/auth/useRateLimitNotice";
import { signupOutcome } from "~/utils/authEntryFlow";

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
const { register, resendVerification } = useAuth();
const { target: returnTarget, withTarget } = useReturnTarget();
const { notifyWait, notifyRateLimited } = useRateLimitNotice();

const success = ref(false);
const resending = ref(false);

// The confirmation is account-neutral: the backend answers the same for a new
// and an already registered address, and so does this page.
const handleRegister = async () => {
  loading.value = true;
  let failure = null;
  try {
    await register({ ...form.value, nextUrl: returnTarget.value });
  } catch (err) {
    failure = err ?? new Error("Signup failed");
  }

  const outcome = signupOutcome(failure);
  success.value = outcome.kind === "confirmation";
  if (outcome.kind === "rateLimited") {
    notifyWait(outcome.seconds);
  } else if (outcome.kind === "failed") {
    notification.error(
      t("notifications.registerError.message"),
      t("notifications.registerError.title"),
    );
  }
  loading.value = false;
};

const handleResend = async () => {
  resending.value = true;
  try {
    await resendVerification(form.value.email, returnTarget.value);
    notification.success(t("register.success.resent"));
  } catch (err) {
    if (!notifyRateLimited(err)) {
      notification.error(
        t("notifications.registerError.message"),
        t("notifications.registerError.title"),
      );
    }
  } finally {
    resending.value = false;
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

      <RegisterSuccessCard
        v-if="success"
        class="shadow-2xl/50"
        :login-to="withTarget('/login')"
        :resending="resending"
        @resend="handleResend"
      />
      <RegisterCard
        v-else
        v-model:user-data="form"
        :loading="loading"
        :login-to="withTarget('/login')"
        class="shadow-2xl/50"
        @submit="handleRegister"
      />
    </div>
  </PageBackground>
</template>

<script setup>
import PendingEmailVerificationCard from "~/components/auth/email-verification/PendingEmailVerificationCard.vue";
import SuccessEmailVerificationCard from "~/components/auth/email-verification/SuccessEmailVerificationCard.vue";
import FailedEmailVerificationCard from "~/components/auth/email-verification/FailedEmailVerificationCard.vue";
import { useAuth } from "~/composables/auth/useAuth.js";
import AlreadyVerifiedEmailCard from "~/components/auth/email-verification/AlreadyVerifiedEmailCard.vue";
import EmailVerificationActionCard from "~/components/auth/email-verification/EmailVerificationActionCard.vue";
import AuthTitleSection from "~/components/auth/AuthTitleSection.vue";
import { useReturnTarget } from "~/composables/auth/useReturnTarget";
import { useRateLimitNotice } from "~/composables/auth/useRateLimitNotice";
import { verifiedReturnTarget } from "~/utils/authEntryFlow";
import {
  appendReturnTarget,
  VERIFY_RETURN_TARGET_PARAM,
} from "~~/shared/utils/returnTarget";

const { verifyEmail } = useAuth();
const { t } = useI18n();
usePageTitle(() => t("meta.pages.emailVerify"));

const router = useRouter();
const route = useRoute();

const token = route.query.token || "";
const id = route.query.id || "";

// The return target of the signup: the mail link carries it as `?next=`, and
// the backend answers the one it kept on the verification hook.
const { options: returnTargetOptions } = useReturnTarget();
const { notifyRateLimited } = useRateLimitNotice();
const returnTarget = ref(
  verifiedReturnTarget(
    { linked: route.query[VERIFY_RETURN_TARGET_PARAM] },
    returnTargetOptions,
  ),
);
const loginTo = computed(() => appendReturnTarget("/login", returnTarget.value));

const verificationStatus = ref("actionRequired"); // "pending", "success", "failed", "alreadyVerified"
const errorType = ref(null);

function fecthVerificationStatus() {
  verificationStatus.value = "pending";

  verifyEmail(token, id)
    .then((response) => {
      returnTarget.value = verifiedReturnTarget(
        {
          answered: response?.data?.nextUrl,
          linked: route.query[VERIFY_RETURN_TARGET_PARAM],
        },
        returnTargetOptions,
      );
      verificationStatus.value = "success";
    })
    .catch((e) => {
      console.error("Email verification failed:", e.statusCode);
      if (notifyRateLimited(e)) {
        verificationStatus.value = "actionRequired";
      } else if (e.statusCode === 400) {
        errorType.value = "invalidToken";
        verificationStatus.value = "failed";
      } else if (e.statusCode === 404) {
        errorType.value = "userNotFound";
        verificationStatus.value = "failed";
      } else if (e.statusCode === 410) {
        errorType.value = "alreadyVerified";
        verificationStatus.value = "alreadyVerified";
      } else {
        errorType.value = "default";
        verificationStatus.value = "failed";
      }
    });
}

onMounted(() => {
  if (!token) {
    router.push("/");
  }
});
</script>

<template>
  <PageBackground>
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <AuthTitleSection class="" />

      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4" />
      </div>
    </div>

    <div class="flex flex-col w-full lg:w-2/5 items-center justify-center p-6">
      <AuthTitleSection class="lg:hidden" />

      <EmailVerificationActionCard
        v-if="verificationStatus === 'actionRequired'"
        :email="id"
        class="shadow-2xl/50"
        @start-verification="fecthVerificationStatus"
      />
      <PendingEmailVerificationCard
        v-if="verificationStatus === 'pending'"
        class="shadow-2xl/50"
      />
      <SuccessEmailVerificationCard
        v-else-if="verificationStatus === 'success'"
        :login-to="loginTo"
        class="shadow-2xl/50"
      />
      <FailedEmailVerificationCard
        v-else-if="verificationStatus === 'failed'"
        :error-type="errorType"
        class="shadow-2xl/50"
      />
      <AlreadyVerifiedEmailCard
        v-else-if="verificationStatus === 'alreadyVerified'"
        :login-to="loginTo"
        class="shadow-2xl/50"
      />
    </div>
  </PageBackground>
</template>

<style scoped></style>

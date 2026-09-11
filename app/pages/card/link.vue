<script setup>
import { useAuth } from "~/composables/auth/useAuth.js";
import CardLinkVerificationActionCard
  from "~/components/auth/card-link-verification/CardLinkVerificationActionCard.vue";
import PendingCardLinkVerificationCard
  from "~/components/auth/card-link-verification/PendingCardLinkVerificationCard.vue";
import FailedCardLinkVerificationCard
  from "~/components/auth/card-link-verification/FailedCardLinkVerificationCard.vue";
import SuccessCardLinkVerificationCard
  from "~/components/auth/card-link-verification/SuccessCardLinkVerificationCard.vue";

const router = useRouter();
const route = useRoute();

const { verifyCardLink } = useAuth();

const token = route.query.token || "";
const id = route.query.id || "";

const { t } = useI18n();
usePageTitle(() => t("meta.pages.cardLink"));

const verificationStatus = ref("actionRequired");
const errorType = ref(null);

function fecthVerificationStatus() {
  verificationStatus.value = "pending";

  verifyCardLink(token, id)
    .then(() => {
      verificationStatus.value = "success";
    })
    .catch((e) => {
      console.error("Link verification failed:", e.statusCode);
      if (e.statusCode === 400) {
        errorType.value = "invalidToken";
        verificationStatus.value = "failed";
      } else if (e.statusCode === 404) {
        errorType.value = "userNotFound";
        verificationStatus.value = "failed";
      } else if (e.statusCode === 410) {
        errorType.value = "alreadyVerified";
        verificationStatus.value = "failed";
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
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4" />
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <CardLinkVerificationActionCard
        v-if="verificationStatus === 'actionRequired'"
        :email="id"
        class="shadow-2xl/50"
        @start-verification="fecthVerificationStatus"
      />

      <SuccessCardLinkVerificationCard
        v-else-if="verificationStatus === 'success'"
        class="shadow-2xl/50"
      />

      <PendingCardLinkVerificationCard
        v-else-if="verificationStatus === 'pending'"
        class="shadow-2xl/50"
      />

      <FailedCardLinkVerificationCard
        v-else-if="verificationStatus === 'failed'"
        :errorType="errorType"
        class="shadow-2xl/50"
        @backToLogin="router.push('/login')"
      />
    </div>
  </PageBackground>
</template>

<style scoped></style>

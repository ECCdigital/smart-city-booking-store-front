<script setup lang="ts">
import { computed } from "vue";

definePageMeta({ layout: "default" });

const route = useRoute();
const { t } = useI18n();

interface ReasonMapping {
  title: string;
  description: string;
  hint?: string;
  icon: string;
  iconClass: string;
  canRetry: boolean;
}

const reason = computed(() => (route.query.reason as string) || "");

const reasonMap = computed<Record<string, ReasonMapping>>(() => ({
  LINK_EXPIRED: {
    title: t("cardLink.failed.expired.title"),
    description: t("cardLink.failed.expired.description"),
    hint: t("cardLink.failed.expired.hint"),
    icon: "i-lucide-clock-alert",
    iconClass: "text-amber-500",
    canRetry: true,
  },
  INVALID_LINK: {
    title: t("cardLink.failed.invalid.title"),
    description: t("cardLink.failed.invalid.description"),
    hint: t("cardLink.failed.invalid.hint"),
    icon: "i-lucide-link-2-off",
    iconClass: "text-red-500",
    canRetry: true,
  },
  LINK_ALREADY_USED: {
    title: t("cardLink.failed.alreadyUsed.title"),
    description: t("cardLink.failed.alreadyUsed.description"),
    icon: "i-lucide-lock",
    iconClass: "text-amber-500",
    canRetry: false,
  },
  CARD_ALREADY_LINKED: {
    title: t("cardLink.failed.cardTaken.title"),
    description: t("cardLink.failed.cardTaken.description"),
    hint: t("cardLink.failed.cardTaken.hint"),
    icon: "i-lucide-credit-card-x",
    iconClass: "text-red-500",
    canRetry: false,
  },
  USER_MISMATCH: {
    title: t("cardLink.failed.mismatch.title"),
    description: t("cardLink.failed.mismatch.description"),
    icon: "i-lucide-alert-circle",
    iconClass: "text-red-500",
    canRetry: false,
  },
}));

const fallback: ReasonMapping = {
  title: t("cardLink.failed.generic.title"),
  description: t("cardLink.failed.generic.description"),
  hint: t("cardLink.failed.generic.hint"),
  icon: "i-lucide-x-circle",
  iconClass: "text-red-500",
  canRetry: true,
};

const mapping = computed<ReasonMapping>(
    () => reasonMap.value[reason.value] || fallback,
);

const showRawReason = computed(
    () => !!reason.value && !reasonMap.value[reason.value],
);
</script>

<template>
  <PageBackground variant="poly" :vignette="true" intensity="normal">
    <div class="flex w-full items-center justify-center p-6">
      <UCard
          variant="soft"
          class="w-full max-w-md rounded-xl glass shadow-2xl/50"
      >
        <div class="flex flex-col items-center text-center py-6">
          <UIcon
              :name="mapping.icon"
              class="text-6xl mb-4"
              :class="mapping.iconClass"
          />
          <h2 class="text-2xl font-semibold mb-2">
            {{ mapping.title }}
          </h2>
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            {{ mapping.description }}
          </p>
          <p
              v-if="mapping.hint"
              class="text-sm text-gray-500 dark:text-gray-400 mb-6"
          >
            {{ mapping.hint }}
          </p>

          <UAlert
              v-if="showRawReason"
              color="neutral"
              variant="subtle"
              :description="`${$t('cardLink.failed.errorCode')}: ${reason}`"
              class="mb-4 text-left w-full"
          />

          <div class="flex gap-2 flex-wrap justify-center">
            <UButton
                to="/login"
                color="neutral"
                variant="outline"
                icon="i-lucide-arrow-left"
            >
              {{ $t("common.backToLogin") }}
            </UButton>

            <UButton
                v-if="mapping.canRetry"
                to="/login"
                color="primary"
                icon="i-lucide-refresh-cw"
            >
              {{ $t("common.retry") }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </PageBackground>
</template>
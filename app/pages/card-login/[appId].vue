<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import { useAuthStore } from "~~/stores/auth.js";
import CardLoginCard from "~/components/auth/CardLoginCard";

definePageMeta({ layout: "default" });

const route = useRoute();
const { t } = useI18n();
usePageTitle(() => t("meta.pages.cardLogin"));
const notification = useNotification();
const authStore = useAuthStore();
const { getCardAuthMethods } = useAuth();

const appId = computed(() => route.params.appId as string);

const cardMethod = ref<any | null>(null);
const loading = ref(true);

const fetchCardMethod = async () => {
  loading.value = true;
  try {
    const methods = await getCardAuthMethods();
    cardMethod.value = methods.find((m: any) => m.id === appId.value) || null;
  } catch {
    cardMethod.value = null;
  } finally {
    loading.value = false;
  }
};

const onSuccess = async () => {
  notification.success(
      t("notifications.loginSuccess.message") +
      ", " +
      (authStore.getUser?.firstName || "") +
      "!",
      t("notifications.loginSuccess.title"),
  );
  const redirect = route.query.redirect;
  if (redirect && typeof redirect === "string") {
    await navigateTo(redirect);
  } else {
    await navigateTo("/");
  }
};

onMounted(fetchCardMethod);
</script>

<template>
  <PageBackground>
    <div class="hidden lg:flex w-3/5 items-center justify-center text-white">
      <div class="max-w-md text-center">
        <h1 class="text-4xl font-bold mb-4">
          {{ cardMethod?.label || $t("cardLogin.fallbackTitle") }}
        </h1>
        <p v-if="cardMethod?.description" class="text-lg opacity-90">
          {{ cardMethod.description }}
        </p>
      </div>
    </div>

    <div class="flex w-full lg:w-2/5 items-center justify-center p-6">
      <div v-if="loading" class="flex items-center justify-center">
        <UIcon
            name="i-lucide-loader-2"
            class="animate-spin text-4xl text-white"
        />
      </div>

      <UAlert
          v-else-if="!cardMethod"
          color="error"
          variant="subtle"
          :title="$t('cardLogin.notFound.title')"
          :description="$t('cardLogin.notFound.description')"
          class="max-w-md"
      />

      <CardLoginCard
          v-else
          :card-method="cardMethod"
          class="shadow-2xl/50"
          @success="onSuccess"
      />
    </div>
  </PageBackground>
</template>
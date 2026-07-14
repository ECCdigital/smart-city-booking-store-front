<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ $t("login.title") }}
      </h2>
    </template>

    <UAlert
      v-if="ssoError"
      color="error"
      variant="subtle"
      :title="ssoErrorMessage.title"
      :description="ssoErrorMessage.description"
      class="mb-4"
    />

    <UForm :state="userData" @submit="submitForm" class="flex flex-col gap-2">
      <UFormField :label="$t('common.email')" required>
        <UInput
          v-model="userData.id"
          type="email"
          placeholder="name@example.com"
          class="w-full"
          required
        />
      </UFormField>

      <UFormField :label="$t('common.password')" required>
        <UInput
          v-model="userData.password"
          :type="show ? 'text' : 'password'"
          :ui="{ trailing: 'pe-1' }"
          placeholder="••••••••"
          class="w-full"
          required
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="show ? 'Hide password' : 'Show password'"
              :aria-pressed="show"
              @click="show = !show"
            />
          </template>
        </UInput>
      </UFormField>

      <NuxtLink
        to="/password/forgot"
        class="text-sm text-primary-600 hover:underline"
      >
        {{ $t("login.forgotPassword") }}
      </NuxtLink>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ $t("common.login") }}
      </UButton>

      <template v-if="cardMethods.length > 0">
        <div class="relative my-3">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-surface-border" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-surface-muted px-2 text-gray-500">
              {{ $t("login.or") }}
            </span>
          </div>
        </div>
      </template>

      <template v-if="ssoEnabled">
        <UButton
          color="neutral"
          variant="outline"
          block
          icon="i-lucide-shield-check"
          @click="$emit('sso-login')"
        >
          {{ $t("login.ssoLoginOrg") }}
        </UButton>
      </template>

      <template v-if="cardMethods.length > 0">
        <UButton
          v-for="method in cardMethods"
          :key="method.id"
          color="neutral"
          variant="outline"
          block
          icon="i-lucide-credit-card"
          class="mt-2"
          :to="`/card-login/${method.id}`"
        >
          {{ method.label }}
        </UButton>
      </template>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("login.noAccount") }}
        <NuxtLink to="/register" class="text-primary-500 hover:underline">
          {{ $t("login.registerHere") }}
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuth } from "~/composables/auth/useAuth.js";

const props = defineProps({
  loading: { type: Boolean, default: false },
  ssoEnabled: { type: Boolean, default: false },
  ssoError: { type: String, default: null },
});

const userData = defineModel("userData", {
  id: "",
  password: "",
});

const emit = defineEmits(["submit", "sso-login"]);
const show = ref(false);

const { t } = useI18n();

const ssoErrorMessage = computed(() => {
  const messages = {
    sso_failed: {
      title: t("login.ssoError.title"),
      description: t("login.ssoError.failed"),
    },
    invalid_state: {
      title: t("login.ssoError.title"),
      description: t("login.ssoError.invalidState"),
    },
    missing_params: {
      title: t("login.ssoError.title"),
      description: t("login.ssoError.missingParams"),
    },
  };
  return (
    messages[props.ssoError] || {
      title: t("login.ssoError.title"),
      description: t("login.ssoError.generic"),
    }
  );
});

const { getCardAuthMethods } = useAuth();

const cardMethods = ref([]);

onMounted(async () => {
  try {
    cardMethods.value = await getCardAuthMethods();
  } catch {
    cardMethods.value = [];
  }
});

function submitForm() {
  emit("submit");
}
</script>

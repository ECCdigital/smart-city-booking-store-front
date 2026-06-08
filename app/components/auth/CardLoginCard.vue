<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { useAuth } from "~/composables/auth/useAuth";
import { useAuthStore } from "~~/stores/auth.js";
import { useLegalAcceptance } from "~/composables/useLegalAcceptance.js";

interface CardField {
  label?: string;
  placeholder?: string;
  helpText?: string;
}

interface CardMethod {
  id: string;
  label?: string;
  description?: string;
  publicIdField: CardField;
  secretField: CardField;
}

const props = defineProps<{
  cardMethod: CardMethod;
}>();

const emit = defineEmits<{
  success: [];
}>();

const { t } = useI18n();
const notification = useNotification();
const authStore = useAuthStore();
const { cardSignup, cardLogin } = useAuth();

const {
  documents: legalDocuments,
  accepted: legalAccepted,
  allAccepted: legalAllAccepted,
  buildPayload: buildLegalAcceptance,
} = useLegalAcceptance();

type Step = "credentials" | "register";
type State =
    | ""
    | "error"
    | "success"
    | "awaiting_verification"
    | "awaiting_link_confirmation";

const step = ref<Step>("credentials");
const state = ref<State>("");
const errorMessage = ref("");
const loading = ref(false);
const showSecret = ref(false);

const credentials = reactive({
  publicId: "",
  secret: "",
});

const registration = reactive({
  email: "",
  firstName: "",
  lastName: "",
  company: "",
});

const secretLabel = computed(
    () => props.cardMethod.secretField?.label || t("cardLogin.secret"),
);
const publicIdLabel = computed(
    () => props.cardMethod.publicIdField?.label || t("cardLogin.publicId"),
);

const submitCredentials = async () => {
  if (!credentials.publicId || !credentials.secret) return;

  loading.value = true;
  state.value = "";
  errorMessage.value = "";

  try {
    const result = await cardLogin({
      appId: props.cardMethod.id,
      publicId: credentials.publicId,
      secret: credentials.secret,
    });

    if (result.requiresRegistration) {
      registration.email = result.prefill?.email || "";
      registration.firstName = result.prefill?.firstName || "";
      registration.lastName = result.prefill?.lastName || "";
      registration.company = result.prefill?.company || "";
      step.value = "register";
      return;
    }

    state.value = "success";
    setTimeout(() => emit("success"), 800);
  } catch (error) {
    handleError(error);
  } finally {
    loading.value = false;
  }
};

const submitRegistration = async () => {
  if (!registration.email) return;

  if (legalDocuments.value.length && !legalAllAccepted.value) {
    notification.error(t("register.legal.required"));
    return;
  }

  loading.value = true;
  state.value = "";
  errorMessage.value = "";

  try {
    const legalAcceptance = buildLegalAcceptance();
    const result = await cardSignup({
      appId: props.cardMethod.id,
      publicId: credentials.publicId,
      secret: credentials.secret,
      email: registration.email,
      firstName: registration.firstName,
      lastName: registration.lastName,
      company: registration.company,
      ...(legalAcceptance ? { legalAcceptance } : {}),
    });

    if (result.status === "link_requested") {
      state.value = "awaiting_link_confirmation";
      notification.success(
          t("cardLogin.linkRequested.message"),
          t("cardLogin.linkRequested.title"),
      );
    } else {
      state.value = "awaiting_verification";
      notification.success(
          t("cardLogin.awaitingVerification.message"),
          t("cardLogin.awaitingVerification.title"),
      );
    }
  } catch (error: any) {
    handleError(error);
  } finally {
    loading.value = false;
  }
};

const handleError = (error: any) => {
  state.value = "error";
  const reason = error.data?.data?.reason;
  const status = error.statusCode || error.data?.statusCode;
  const backendMsg = error.statusMessage || error.data?.statusMessage;

  const messages: Record<string, string> = {
    not_found: t("cardLogin.errors.notFound"),
    secret_mismatch: t("cardLogin.errors.secretMismatch", {
      label: secretLabel.value,
    }),
    expired: t("cardLogin.errors.expired"),
    email_not_verified: t("cardLogin.errors.emailNotVerified"),
    card_already_linked: t("cardLogin.errors.cardAlreadyLinked"),
    account_already_has_card: t("cardLogin.errors.accountAlreadyHasCard"),
  };

  if (reason && messages[reason]) {
    errorMessage.value = messages[reason];
  } else if (status === 403) {
    errorMessage.value = backendMsg || t("cardLogin.errors.forbidden");
  } else if (status === 503) {
    errorMessage.value = t("cardLogin.errors.serviceUnavailable");
  } else {
    errorMessage.value = backendMsg || t("cardLogin.errors.generic");
  }
};

const back = async () => {
  if (step.value === "register" && state.value !== "awaiting_verification") {
    step.value = "credentials";
    state.value = "";
    errorMessage.value = "";
    return;
  }
  await navigateTo("/login");
};
</script>

<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ cardMethod.label || $t("cardLogin.title") }}
      </h2>
      <p
          v-if="cardMethod.description"
          class="text-sm text-center text-gray-500 mt-1"
      >
        {{ cardMethod.description }}
      </p>
    </template>

    <UAlert
        v-if="state === 'success'"
        color="success"
        variant="subtle"
        :title="$t('cardLogin.success.title')"
        :description="$t('cardLogin.success.description')"
        class="mb-4"
    />

    <UAlert
        v-else-if="state === 'awaiting_verification'"
        color="info"
        variant="subtle"
        :title="$t('cardLogin.awaitingVerification.title')"
        :description="$t('cardLogin.awaitingVerification.description')"
        class="mb-4"
    />

    <UAlert
        v-else-if="state === 'awaiting_link_confirmation'"
        color="info"
        variant="subtle"
        :title="$t('cardLogin.linkRequested.title')"
        :description="
        $t('cardLogin.linkRequested.description', {
          email: registration.email,
        })
      "
        class="mb-4"
    />

    <UAlert
        v-if="state === 'error'"
        color="error"
        variant="subtle"
        :title="$t('cardLogin.errors.title')"
        :description="errorMessage"
        class="mb-4"
    />

    <UForm
        v-if="step === 'credentials' && state !== 'success'"
        :state="credentials"
        class="flex flex-col gap-2"
        @submit="submitCredentials"
    >
      <UFormField :label="publicIdLabel" required>
        <UInput
            v-model="credentials.publicId"
            :placeholder="cardMethod.publicIdField?.placeholder"
            icon="i-lucide-credit-card"
            class="w-full"
            required
        />
        <template
            v-if="cardMethod.publicIdField?.helpText"
            #help
        >
          {{ cardMethod.publicIdField.helpText }}
        </template>
      </UFormField>

      <UFormField :label="secretLabel" required>
        <UInput
            v-model="credentials.secret"
            :type="showSecret ? 'text' : 'password'"
            :placeholder="cardMethod.secretField?.placeholder"
            :ui="{ trailing: 'pe-1' }"
            icon="i-lucide-shield"
            class="w-full"
            required
        >
          <template #trailing>
            <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showSecret ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="
                showSecret ? 'Hide secret' : 'Show secret'
              "
                :aria-pressed="showSecret"
                @click="showSecret = !showSecret"
            />
          </template>
        </UInput>
        <template
            v-if="cardMethod.secretField?.helpText"
            #help
        >
          {{ cardMethod.secretField.helpText }}
        </template>
      </UFormField>

      <div class="flex justify-between mt-4">
        <UButton color="neutral" variant="outline" @click="back">
          {{ $t("common.back") }}
        </UButton>
        <UButton
            type="submit"
            color="primary"

            :loading="loading"
            icon="i-lucide-log-in"
        >
          {{ $t("common.login") }}
        </UButton>
      </div>
    </UForm>

    <UForm
        v-else-if="
        step === 'register' &&
        state !== 'awaiting_verification' &&
        state !== 'awaiting_link_confirmation'
      "
        :state="registration"
        class="flex flex-col gap-2"
        @submit="submitRegistration"
    >
      <UAlert
          color="info"
          variant="subtle"
          :title="$t('cardLogin.register.infoTitle')"
          :description="$t('cardLogin.register.infoDescription')"
          class="mb-2"
      />

      <UFormField :label="$t('common.email')" required>
        <UInput
            v-model="registration.email"
            type="email"
            placeholder="name@example.com"
            icon="i-lucide-mail"
            class="w-full"
            required
        />
      </UFormField>

      <UFormField :label="$t('common.firstName')">
        <UInput
            v-model="registration.firstName"
            icon="i-lucide-user"
            class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('common.lastName')">
        <UInput
            v-model="registration.lastName"
            icon="i-lucide-user"
            class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('common.company')">
        <UInput
            v-model="registration.company"
            icon="i-lucide-building"
            class="w-full"
        />
      </UFormField>

      <div
          v-if="legalDocuments.length"
          class="flex flex-col gap-2 mt-2"
      >
        <UCheckbox
            v-for="doc in legalDocuments"
            :key="doc.key"
            v-model="legalAccepted[doc.key]"
            required
        >
          <template #label>
            <span>
              {{ $t("register.legal.acceptPrefix") }}
              <a
                  :href="doc.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-500 hover:underline"
              >
                {{ $t(`register.legal.${doc.key}`) }}
              </a>
            </span>
          </template>
        </UCheckbox>
      </div>

      <div class="flex justify-between mt-4">
        <UButton color="neutral" variant="outline" @click="back">
          {{ $t("common.back") }}
        </UButton>
        <UButton
            type="submit"
            color="primary"
            :loading="loading"
            icon="i-lucide-user-plus"
        >
          {{ $t("cardLogin.register.submit") }}
        </UButton>
      </div>
    </UForm>

    <div
        v-if="
        state === 'awaiting_verification' ||
        state === 'awaiting_link_confirmation'
      "
        class="flex justify-center mt-4"
    >
      <UButton
          color="neutral"
          variant="outline"
          to="/login"
          icon="i-lucide-arrow-left"
      >
        {{ $t("common.backToLogin") }}
      </UButton>
    </div>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        <NuxtLink to="/login" class="text-primary-500 hover:underline">
          {{ $t("cardLogin.useDifferentMethod") }}
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>
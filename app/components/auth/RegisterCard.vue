<template>
  <UCard
    variant="soft"
    class="w-full max-w-md rounded-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg"
  >
    <template #header>
      <h2 class="text-2xl font-semibold text-center">
        {{ $t("register.title") }}
      </h2>
    </template>

    <UForm :state="userData" @submit="submitForm" class="flex flex-col gap-2">
      <div class="flex justify-between">
        <UFormField :label="$t('common.firstName')" required>
          <UInput
            v-model="userData.firstname"
            type="text"
            placeholder="Max"
            required
          />
        </UFormField>

        <!-- Nachname -->
        <UFormField :label="$t('common.lastName')" required>
          <UInput
            v-model="userData.lastname"
            type="text"
            placeholder="Mustermann"
            required
          />
        </UFormField>
      </div>

      <!-- Firma -->
      <UFormField :label="$t('common.company')">
        <UInput
          v-model="userData.company"
          type="text"
          placeholder="Meine Firma GmbH"
          class="w-full"
        />
      </UFormField>

      <!-- E-Mail -->
      <UFormField :label="$t('common.email')" required>
        <UInput
          v-model="userData.email"
          type="email"
          placeholder="name@example.com"
          class="w-full"
          required
        />
      </UFormField>

      <!-- Passwort -->
      <UFormField :label="$t('common.password')" required>
        <UInput
          v-model="userData.password"
          :type="showPassword ? 'text' : 'password'"
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
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              aria-controls="password"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>
      <UProgress
        :color="color"
        :indicator="text"
        :model-value="score"
        :max="4"
        size="sm"
      />

      <p id="password-strength" class="text-sm font-medium">
        {{ text }}. {{ $t("register.passwordStrengthCheck.description") }}:
      </p>

      <ul class="space-y-1" aria-label="Password requirements">
        <li
          v-for="(req, index) in strength"
          :key="index"
          class="flex items-center gap-0.5"
          :class="req.met ? 'text-success' : 'text-muted'"
        >
          <UIcon
            :name="req.met ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
            class="size-4 shrink-0"
          />

          <span class="text-xs font-light">
            {{ req.text }}
            <span class="sr-only">
              {{ req.met ? " - Requirement met" : " - Requirement not met" }}
            </span>
          </span>
        </li>
      </ul>

      <!-- Passwort wiederholen -->
      <UFormField :label="$t('common.repeatPassword')" required>
        <UInput
          v-model="userData.passwordRepeat"
          :type="showPasswordRepeat ? 'text' : 'password'"
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
              :icon="showPasswordRepeat ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="
                showPasswordRepeat ? 'Hide password' : 'Show password'
              "
              :aria-pressed="showPasswordRepeat"
              aria-controls="passwordRepeat"
              @click="showPasswordRepeat = !showPasswordRepeat"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Submit -->
      <UButton
        type="submit"
        color="primary"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ $t("common.register") }}
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-sm text-center text-gray-500 dark:text-gray-400">
        {{ $t("register.haveAccount") }}
        <NuxtLink to="/login" class="text-primary-500 hover:underline">
          {{ $t("common.login") }}
        </NuxtLink>
      </p>
    </template>
  </UCard>
</template>

<script setup>
import { ref } from "vue";

const t = useI18n().t;

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  userData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["submit"]);

const showPassword = ref(false);
const showPasswordRepeat = ref(false);

function submitForm() {
  // Optional: Passwort-Abgleich prüfen
  if (props.userData.password !== props.userData.passwordRepeat) {
    alert("Die Passwörter stimmen nicht überein!");
    return;
  }
  emit("submit");
}

function checkStrength(str) {
  const requirements = [
    { regex: /.{8,}/, text: t("register.passwordStrengthCheck.minLength") },
    { regex: /\d/, text: t("register.passwordStrengthCheck.number") },
    { regex: /[a-z]/, text: t("register.passwordStrengthCheck.lowercase") },
    { regex: /[A-Z]/, text: t("register.passwordStrengthCheck.uppercase") },
  ];

  return requirements.map((req) => ({
    met: req.regex.test(str),
    text: req.text,
  }));
}

const strength = computed(() => checkStrength(props.userData.password || ""));
const score = computed(() => strength.value.filter((req) => req.met).length);

const color = computed(() => {
  if (score.value === 0) return "neutral";
  if (score.value <= 1) return "error";
  if (score.value <= 2) return "warning";
  if (score.value === 3) return "warning";
  return "success";
});

const text = computed(() => {
  if (score.value === 0)
    return t("register.passwordStrengthCheck.nonePassword");
  if (score.value <= 2) return t("register.passwordStrengthCheck.weakPassword");
  if (score.value === 3)
    return t("register.passwordStrengthCheck.mediumPassword");
  return t("register.passwordStrengthCheck.strongPassword");
});
</script>

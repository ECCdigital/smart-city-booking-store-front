<template>
  <UCard variant="soft" class="w-full max-w-md rounded-xl glass">
    <template #header>
      <h2 class="text-center text-2xl font-semibold">
        {{ $t("register.title") }}
      </h2>
    </template>

    <UForm :state="userData" class="flex flex-col gap-2" @submit="submitForm">
      <div class="flex justify-between">
        <UFormField :label="$t('common.firstName')" required>
          <UInput
            v-model="userData.firstname"
            type="text"
            placeholder="Max"
            required
          />
        </UFormField>

        <UFormField :label="$t('common.lastName')" required>
          <UInput
            v-model="userData.lastname"
            type="text"
            placeholder="Mustermann"
            required
          />
        </UFormField>
      </div>

      <UFormField :label="$t('common.company')">
        <UInput
          v-model="userData.company"
          type="text"
          placeholder="Meine Firma GmbH"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('common.email')" required>
        <UInput
          v-model="userData.email"
          type="email"
          placeholder="name@example.com"
          class="w-full"
          required
        />
      </UFormField>

      <PasswordInput
        v-model="userData.password"
        :label="$t('common.password')"
        is-required
        input-style-classes="w-full"
      />

      <PasswordProgress :password="userData.password" />

      <PasswordInput
        v-model="userData.passwordRepeat"
        :label="$t('common.repeatPassword')"
        is-required
        input-style-classes="w-full"
      />

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
import PasswordInput from "~/components/auth/PasswordInput.vue";
import PasswordProgress from "~/components/auth/PasswordProgress.vue";

//const t = useI18n().t;

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const userData = defineModel("userData", {
  type: Object,
  required: true,
});

const emit = defineEmits(["submit"]);

function submitForm() {
  if (userData.value.password !== userData.value.passwordRepeat) {
    alert("Die Passwörter stimmen nicht überein!");
    return;
  }
  emit("submit");
}
</script>

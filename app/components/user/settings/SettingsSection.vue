<template>
  <div>
    <div :key="formVersion">
      <!-- Contact Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Kontaktdaten</h3>
        </div>
        <div class="md:flex space-y-2 md:space-y-0">
          <SettingsInputField
            field-id="firstName"
            label="Vorname"
            :value="currentUser.firstName"
            icon="i-lucide-user"
            class="basis-1/2"
            @update="updateUser"
          />
          <SettingsInputField
            field-id="lastName"
            label="Nachname"
            :value="currentUser.lastName"
            icon="i-lucide-user"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
        <div class="md:flex space-y-2 md:space-y-0 my-3">
          <SettingsInputField
            field-id="company"
            label="Firma"
            :value="currentUser.company"
            icon="i-lucide-building-2"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
        <div class="md:flex space-y-2 md:space-y-0 my-3">
          <SettingsInputField
            field-id="id"
            label="E-Mail"
            :value="currentUser.id"
            icon="i-lucide-mail"
            is-disabled
            class="basis-1/2"
          />
          <SettingsInputField
            field-id="phone"
            label="Telefonnummer"
            :value="currentUser.phone"
            icon="i-lucide-phone"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
        <div class="md:flex space-y-2 md:space-y-0 my-3 mt-6">
          <SettingsInputField
            field-id="address"
            label="Straße und Hausnummer"
            :value="currentUser.address"
            icon="i-lucide-house"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
        <div class="md:flex space-y-2 md:space-y-0 my-3 mt-3">
          <SettingsInputField
            field-id="zipCode"
            label="PLZ"
            :value="currentUser.zipCode"
            icon="i-lucide-house"
            class="basis-1/2"
            @update="updateUser"
          />
          <SettingsInputField
            field-id="city"
            label="Stadt"
            :value="currentUser.city"
            icon="i-lucide-house"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
      </div>

      <!-- Security Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Sicherheit</h3>
        </div>
        <div class="flex basis-1/2 mb-5">
          Account verifiziert?
          <UIcon
            v-if="currentUser.isVerified"
            name="i-lucide-square-check-big"
            class="ml-2 mt-1 text-green-600 dark:text-green-500"
          />
          <UIcon
            v-else
            name="i-lucide-square"
            class="ml-2 mt-1 text-red-600 dark:text-red-500"
          />
        </div>
        <div class="flex items-center basis-1/2 mb-5 md:mb-2">
          Passwort:
          <UButton
            v-if="!enableEditingPassword"
            icon="i-lucide-edit"
            label="Passwort ändern"
            class="ml-2"
            @click="() => (enableEditingPassword = true)"
          />
        </div>

        <div
          v-if="enableEditingPassword"
          class="md:flex space-y-2 md:space-y-0 my-3"
        >
          <div class="basis-1/2 mb-5 md:mb-2">
            <PasswordInput
              v-model="newPassword"
              label="Neues Passwort"
              input-style-classes="w-full md:w-[70%]"
            />
            <PasswordProgress
              :password="newPassword"
              class="mt-1 w-full md:w-[70%]"
            />
          </div>
          <PasswordInput
            v-model="repeatedPassword"
            label="Neues Passwort (Wiederholung)"
            input-style-classes="w-full md:w-[70%]"
            class="basis-1/2"
          />
        </div>
        <UButton
          v-if="enableEditingPassword"
          icon="i-lucide-save"
          label="Speichern"
          color="primary"
          variant="solid"
          class="mt-2 md:mt-3"
          @click="changePassword()"
        />
      </div>
    </div>

    <div
      v-if="hasUnsavedChanges"
      class="fixed inset-x-0 bottom-0 m-2 rounded-xl z-50 border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-800/95"
    >
      <div
        class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3"
      >
        <span class="text-sm">Sie haben nicht gespeicherte Änderungen.</span>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-save"
            label="Speichern"
            color="primary"
            variant="solid"
            @click="saveUpdatedUser()"
          />
          <UButton
            icon="i-lucide-rotate-ccw"
            label="Zurücksetzen"
            color="neutral"
            variant="soft"
            @click="resetUserChanges()"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import SettingsInputField from "~/components/user/settings/SettingsInputField.vue";
import { useAuthStore } from "~~/stores/auth.js";
import PasswordInput from "~/components/auth/PasswordInput.vue";
import PasswordProgress from "~/components/auth/PasswordProgress.vue";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const authStore = useAuthStore();
const notification = useNotification();

function cloneUser(user) {
  return JSON.parse(JSON.stringify(user));
}

const originalUser = ref(cloneUser(props.user));
const currentUser = ref(cloneUser(props.user));
const formVersion = ref(0);

const hasUnsavedChanges = computed(
  () =>
    JSON.stringify(currentUser.value) !== JSON.stringify(originalUser.value),
);

const newPassword = ref("");
const repeatedPassword = ref("");

const enableEditingContactInfo = ref(false);
const enableEditingPassword = ref(false);

function updateUser({ updatedField, updatedValue }) {
  currentUser.value[updatedField] = updatedValue;
}
async function saveUpdatedUser() {
  await authStore.updateUser(currentUser.value);
  originalUser.value = cloneUser(currentUser.value);
  currentUser.value = cloneUser(currentUser.value);
  formVersion.value += 1;
  notification.success(
    "Ihre Änderungen wurden erfolgreich gespeichert.",
    "Änderungen gespeichert",
  );

  enableEditingContactInfo.value = false;
}

function resetUserChanges() {
  currentUser.value = cloneUser(originalUser.value);
  formVersion.value += 1;
}

function changePassword() {
  if (newPassword.value !== repeatedPassword.value) {
    notification.error(
      "Die eingegebenen Passwörter stimmen nicht überein.",
      "Passwortänderung fehlgeschlagen",
    );
    return;
  }
  authStore.changePassword(currentUser.value.id, newPassword.value);
  notification.success(
    "Ihr Passwort wurde erfolgreich geändert.",
    "Passwort geändert",
  );
  enableEditingPassword.value = false;
  newPassword.value = "";
  repeatedPassword.value = "";
}
</script>
<style scoped></style>

<template>
  <div class="w-full container-md">
    <h1 class="text-2xl font-bold">Einstellungen</h1>

    <div>
      <p class="mt-2 mb-5">
        Verwalten Sie Ihre persönlichen Angaben.
        Sie haben außerdem die Möglichkeit, Ihr
        Passwort zu ändern.
      </p>

      <!-- Personal Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Persönliche Angaben</h3>
            <UButton
                v-if="!enableEditingPersonalInfo"
              icon="i-lucide-edit"
              label="Bearbeiten"
              color="neutral"
              variant="soft"
              @click="() => (enableEditingPersonalInfo = true)"
            />
        </div>
        <div class="md:flex space-y-2 md:space-y-0">
          <SettingsInputField
            field-id="firstName"
            label="Vorname"
            :value="currentUser.firstName"
            icon="i-lucide-user"
            :is-disabled="!enableEditingPersonalInfo"
            class="basis-1/2"
            @update="updateUser"
          />
          <SettingsInputField
            field-id="lastName"
            label="Nachname"
            :value="currentUser.lastName"
            icon="i-lucide-user"
            :is-disabled="!enableEditingPersonalInfo"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
        <!--
        <div class="md:flex space-y-2 md:space-y-0 my-3">
          <SettingsInputField
            field-id="created"
            label="Beigetreten am"
            :value="formatDate(user.created)"
            icon="i-lucide-user"
            is-disabled
            class="basis-1/2"
          />
        </div>
        -->
        <UButton
            v-if="enableEditingPersonalInfo"
            icon="i-lucide-save"
            label="Änderungen speichern"
            color="primary"
            variant="solid"
            class="mt-2 md:mt-5"
            @click="saveUpdatedUser()"
        />
      </div>

      <!-- Contact Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Kontaktdaten</h3>
            <UButton
                v-if="!enableEditingContactInfo"
              icon="i-lucide-edit"
              label="Bearbeiten"
              color="neutral"
              variant="soft"
              @click="() => (enableEditingContactInfo = true)"
            />
        </div>
        <div class="md:flex space-y-2 md:space-y-0 my-3">
          <SettingsInputField
            field-id="company"
            label="Firma"
            :value="currentUser.company"
            icon="i-lucide-building-2"
            :is-disabled="!enableEditingContactInfo"
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
            :is-disabled="!enableEditingContactInfo"
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
            :is-disabled="!enableEditingContactInfo"
            class="basis-1/2"
          />
        </div>
        <div class="md:flex space-y-2 md:space-y-0 my-3 mt-3">
          <SettingsInputField
            field-id="zipCode"
            label="PLZ"
            :value="currentUser.zipCode"
            icon="i-lucide-house"
            :is-disabled="!enableEditingContactInfo"
            class="basis-1/2"
          />
          <SettingsInputField
            field-id="city"
            label="Stadt"
            :value="currentUser.city"
            icon="i-lucide-house"
            :is-disabled="!enableEditingContactInfo"
            class="basis-1/2"
            @update="updateUser"
          />
        </div>
        <UButton
            v-if="enableEditingContactInfo"
            icon="i-lucide-save"
            label="Änderungen speichern"
            color="primary"
            variant="solid"
            class="mt-2 md:mt-5"
            @click="saveUpdatedUser()"
        />
      </div>

      <!-- Security Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Sicherheit</h3>
          <UButton
            v-if="!enableEditingPassword"
            icon="i-lucide-edit"
            label="Passwort ändern"
            color="neutral"
            variant="soft"
            class="ml-2"
            @click="() => (enableEditingPassword = true)"
          />
        </div>
        <div class="flex basis-1/2 mb-5 md:mb-2">
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

const currentUser = ref(JSON.parse(JSON.stringify(props.user)));

const newPassword = ref("");
const repeatedPassword = ref("");

const enableEditingPersonalInfo = ref(false);
const enableEditingContactInfo = ref(false);
const enableEditingPassword = ref(false);

// helpers
/*const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};*/

function updateUser({ updatedField, updatedValue }) {
  currentUser.value[updatedField] = updatedValue;
}
async function saveUpdatedUser() {
  await authStore.updateUser(currentUser.value);
  notification.success(
    "Ihre Änderungen wurden erfolgreich gespeichert.",
    "Änderungen gespeichert",
  );

  enableEditingPersonalInfo.value = false;
  enableEditingContactInfo.value = false;
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

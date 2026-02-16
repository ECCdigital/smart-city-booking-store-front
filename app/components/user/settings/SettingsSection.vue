<template>
  <div class="container-md pb-15">
    <h2 class="text-2xl font-bold">Einstellungen</h2>

    <div>
      <p class="mt-2 mb-5">
        Verwalten Sie Ihre persönlichen Angaben. Sie haben die Möglichkeit, Ihr
        Passwort zu ändern oder Ihren Account dauerhaft zu löschen.
      </p>

      <!-- Personal Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Persönliche Angaben</h3>
          <UTooltip
            v-if="!enableEditingPersonalInfo"
            text="Angaben ändern"
            class="ml-2"
          >
            <UButton
              icon="i-lucide-edit"
              label="Bearbeiten"
              color="neutral"
              variant="soft"
              @click="() => (enableEditingPersonalInfo = true)"
            />
          </UTooltip>
          <UTooltip v-else text="Änderungen speichern" class="ml-2">
            <UButton
              icon="i-lucide-save"
              label="Speichern"
              color="primary"
              variant="solid"
              @click="saveUpdatedUser()"
            />
          </UTooltip>
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
            @update="updateUser"
          />
        </div>
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
      </div>

      <!-- Contact Information Section -->
      <div class="mb-10 space-y-5">
        <div class="flex justify-between md:justify-normal mb-2 md:mb-5">
          <h3 class="text-xl font-bold">Kontaktdaten</h3>
          <UTooltip
            v-if="!enableEditingContactInfo"
            text="Angaben ändern"
            class="ml-2"
          >
            <UButton
              icon="i-lucide-edit"
              label="Bearbeiten"
              color="neutral"
              variant="soft"
              @click="() => (enableEditingContactInfo = true)"
            />
          </UTooltip>
          <UTooltip v-else text="Änderungen speichern" class="ml-2">
            <UButton
              icon="i-lucide-save"
              label="Speichern"
              color="primary"
              variant="solid"
              @click="saveUpdatedUser()"
            />
          </UTooltip>
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
            @update="updateUser"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import SettingsInputField from "~/components/user/settings/SettingsInputField.vue";
import {useAuthStore} from "~~/stores/auth.js";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const authStore = useAuthStore();
const notification = useNotification();

const currentUser = ref(JSON.parse(JSON.stringify(props.user)));

const enableEditingPersonalInfo = ref(false);
const enableEditingContactInfo = ref(false);

// helpers
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
</script>
<style scoped></style>

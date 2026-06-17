<template>
  <div class="w-full flex flex-col">
    <!-- stepper -->
    <div class="flex gap-2 mb-3">
      <div
        v-for="(_, idx) in remoteAccessSteps"
        :key="idx"
        class="flex-1 h-1 rounded-full transition-colors duration-300"
        :class="
          idx === currentAccessStep
            ? 'bg-primary'
            : 'bg-gray-200 dark:bg-gray-700'
        "
      />
    </div>

    <!-- step 1: confirm location-->
    <div class="text-md font-semibold mb-2">
      Schritt {{ currentAccessStep + 1 }} von
      {{ remoteAccessSteps.length }} &middot;
      {{ remoteAccessSteps[currentAccessStep].label }}
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
      {{ remoteAccessSteps[currentAccessStep].description }}
    </p>

    <div v-if="!selectedAccessAction" class="space-y-3">
      <button
        v-for="action in accessActions"
        :key="action.value"
        type="button"
        :class="locationOptionClass"
        @click="() => (selectedAccessAction = action.value)"
      >
        <div class="flex items-center gap-3 text-left w-full">
          <div
            class="flex flex-shrink-0 items-center justify-center rounded-lg w-8 h-8 bg-primary/10"
          >
            <UIcon :name="action.icon" class="w-5 h-5 text-primary font-bold" />
          </div>
          <div class="mr-1">
            <div class="font-medium text-gray-900 dark:text-gray-100">
              {{ action.label }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              {{ action.description }}
            </div>
          </div>
        </div>
        <UIcon name="i-lucide-chevron-right" class="text-gray-400" />
      </button>
    </div>
    <div v-else-if="selectedAccessAction === 'qr'" class="mb-25">
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
        QR-Code scannen
      </p>
      <!-- toDo - QR Code Scanner Component einbauen --->
    </div>
    <div v-else-if="selectedAccessAction === 'deviceLocation'" class="mb-25">
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Gerätestandort prüfen
      </p>
      <!-- toDo - Location Check Component einbauen --->
    </div>
    <UButton
      v-if="selectedAccessAction"
      label="Andere Methode wählen"
      icon="i-lucide-chevron-left"
      variant="ghost"
      class="px-0 text-sm"
      @click="() => (selectedAccessAction = '')"
    />

    <!-- step 2: open door -->
    <div>...</div>
  </div>
</template>
<script setup>
const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
});

const remoteAccessSteps = [
  {
    value: "confirmLocation",
    label: "Standort bestätigen",
    description: "Bitte bestätigen Sie, dass Sie direkt vor der Tür stehen.",
  },
  {
    value: "openDoor",
    label: "Tür öffnen",
    description: "",
  },
];
const currentAccessStep = ref(0);

const accessActions = [
  {
    value: "qr",
    icon: "i-lucide-qr-code",
    label: "QR-Code scannen",
    description: "Code an der Tür mit der Kamera erfassen.",
  },
  {
    value: "deviceLocation",
    icon: "i-lucide-locate",
    label: "Gerätestandort verwenden",
    description: "Automatisch prüfen, ob Sie sich vor der Tür befinden.",
  },
];
const selectedAccessAction = ref("");

const locationOptionClass =
  "w-full gap-2" +
  "border border-2 border-gray-200 dark:border-gray-700 " +
  "rounded-lg px-4 py-3 " +
  "flex items-center justify-between " +
  "hover:bg-gray-50 dark:hover:bg-gray-800 " +
  "transition-colors cursor-pointer";
</script>

<style scoped></style>

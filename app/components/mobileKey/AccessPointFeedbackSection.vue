<template>
  <div
    class="w-24 h-24 z-15 rounded-full flex items-center justify-center"
    :class="
      isSuccess && isError
        ? 'bg-warning/40'
        : isError
          ? 'bg-error/40'
          : isSuccess
            ? 'bg-success/40'
            : ''
    "
  >
    <UIcon :name="icon" class="!text-[40px] text-gray-600" />
  </div>

  <div class="text-center text-sm mx-5">
    <p class="mb-1 text-lg font-semibold">{{ title }}</p>
    {{ subtitle }}
  </div>

  <div
    v-if="errorMessage"
    class="bg-error/50 w-full rounded-xl text-sm mx-2 p-2"
  >
    <p class="mb-0.5 font-semibold text-red-800">Fehler:</p>
    {{ errorDescription }}
    <!-- toDo - wie sehen ErrorMessages aus? Welche Fehler können hier auftreten??? Anpassen -->
  </div>

  <UButton
    variant="solid"
    class="nextStepButton mt-1 flex justify-center py-3 shadow-lg cursor-pointer w-full"
    @click="() => emit('done')"
  >
    {{ nextStepButtonLabel }}
  </UButton>
</template>
<script setup>
const props = defineProps({
  isSuccess: {
    type: Boolean,
    required: false,
  },
  isError: {
    type: Boolean,
    required: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    required: true,
  },
  accessPointLabel: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["done"]);

const icon = computed(() => {
  if (props.isSuccess && props.isError) {
    return "i-lucide-message-circle-question-mark";
  }
  if (props.isError) {
    return "i-lucide-x";
  }
  if (props.isSuccess) {
    return "i-lucide-check";
  }
  return "";
});
const title = computed(() => {
  if (props.isSuccess && props.isError) {
    return "Unklarer Zustand";
  }
  if (props.isError) {
    return "Schloss reagiert nicht";
  }
  if (props.isSuccess && props.variant === "open") {
    return "Schloss erfolgreich geöffnet!";
  } else if (props.isSuccess && props.variant === "close") {
    return "Schloss erfolgreich geschlossen!";
  }
  return "";
});

const subtitle = computed(() => {
  if (props.isSuccess && props.isError) {
    return "Etwas ist schief gelaufen. Bitte versuchen Sie es erneut...";
  }

  if (props.isError && props.variant === "open") {
    return `${props.accessPointLabel} konnte nicht geöffnet werden. Bitte versuchen Sie es erneut.`;
  } else if (props.isError && props.variant === "close") {
    return `${props.accessPointLabel} konnte nicht geschlossen werden. Bitte versuchen Sie es erneut.`;
  }

  if (props.isSuccess && props.variant === "open") {
    return `${props.accessPointLabel} wurde erfolgreich geöffnet.`;
  } else if (props.isSuccess && props.variant === "close") {
    return `${props.accessPointLabel} wurde erfolgreich geschlossen.`;
  }
  return "";
});

const errorDescription = computed(() => {
  if (!props.errorMessage) {
    return "";
  }

  switch (props.errorMessage) {
    case "Unauthorized":
      return "Es gibt ein Problem mit Ihrer Berechtigung. Bitte prüfen Sie Ihre Buchungen oder kontaktieren Sie den Support.";
    case "Internal Server Error":
      return "Es gibt ein Problem mit dem Schließsystem. Bitte kontaktieren Sie den Support.";
    case "Forbidden":
      return "Sie haben keine Berechtigung, diese Aktion durchzuführen. Bitte überprüfen Sie Ihre Zugangsdaten oder wenden Sie sich an den Support.";
    default:
      return "Ein unbekannter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support, wenn das Problem weiterhin besteht.";
  }
});

const nextStepButtonLabel = computed(() => {
  if (props.isSuccess) {
    return "Fertig";
  }
  return "Erneut versuchen";
});
</script>
<style scoped>
.nextStepButton {
  background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
  );
}
</style>

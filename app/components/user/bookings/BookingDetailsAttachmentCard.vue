<template>
  <div class="bg-primary/20 p-3 rounded mb-1 flex justify-between">
    <div class="text-gray-700 dark:text-gray-300">
      <p v-if="isPaymentDocument" class="text-sm">
        {{ attachmentType }}
      </p>
      {{ attachment.title }}
      <p v-if="!isPaymentDocument" class="text-sm">
        {{ attachmentType }} für
        <span class="italic">{{ getBookableTitle(attachment.bookableId) }}</span>
      </p>
      <div v-if="!isPaymentDocument" class="mt-1 flex items-center">
        Akzeptiert:
        <UIcon
          v-if="attachment.accepted"
          name="i-lucide-square-check-big"
          class="ml-1 text-green-600 dark:text-green-500"
        />
        <UIcon
          v-else
          name="i-lucide-square"
          class="ml-1 text-red-600 dark:text-red-500"
        />
      </div>
      <div v-if="isPaymentDocument" class="mt-2 text-sm flex items-center">
        <UIcon name="i-lucide-calendar-clock" class="size-3 mr-1"/>
        Erstellt: {{ formatDate(attachment.timeCreated) }}
      </div>
    </div>
    <div class="grid content-center">
      <UButton
        icon="i-lucide-download"
        variant="soft"
        size="lg"
        class="text-gray-700 dark:text-gray-300"
        :href="!isPaymentDocument ? attachment.url : ''"
        target="_blank"
      />
      <!--toDo - check functionality!!!!!!!!!!!!!!!!!  -->
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  attachment: {
    type: Object,
    required: true,
  },
  isPaymentDocument:{
    type: Boolean,
    default: false,
  },
  bookables: {
    type: Array,
    default: () => [],
  },
});

const attachmentType = computed(() => {
  switch (props.attachment.type) {
    case "invoice":
      return "Rechnung";
    case "receipt":
      return "Zahlungsbeleg";
    case "agreement":
      return "Nutzervereinbarung";
    case "privacy-agreement":
      return "Datenschutzerklärung";
    case "user-manual":
      return "Betriebsanleitung";
    case "security-information":
      return "Sicherheitshinweise";
    case "product-information":
      return "Produktinformationen";
    default:
      return "Unbekannter Anhangstyp";
  }
});

const formatDate = (dateString) => {
  console.log(dateString)
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function getBookableTitle(bookableId) {
  if(!props.bookables || props.bookables.length === 0) {
    return "Unbekanntes Buchungsobjekt";
  }
  return props.bookables.find(
    (bookable) => bookable.id === bookableId
  ).title
}
</script>

<style scoped></style>

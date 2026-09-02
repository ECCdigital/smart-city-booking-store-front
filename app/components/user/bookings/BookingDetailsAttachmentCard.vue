<template>
  <div class="bg-primary/20 p-3 rounded mb-1 flex justify-between">
    <div class="text-gray-700 dark:text-gray-300">
      <p v-if="isPaymentDocument" class="text-sm">
        {{ attachmentType }}
      </p>
      {{ attachment.title }}
      <p v-if="!isPaymentDocument" class="text-sm">
        {{ attachmentType }} für
        <span class="italic">{{
          getBookableTitle(attachment.bookableId)
        }}</span>
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
        <UIcon name="i-lucide-calendar-clock" class="size-3 mr-1" />
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
        @click="downloadAttachment()"
      />
    </div>
  </div>
</template>
<script setup>
import { useBookings } from "~/composables/api/useBookings.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  attachment: {
    type: Object,
    required: true,
  },
  isPaymentDocument: {
    type: Boolean,
    default: false,
  },
  bookables: {
    type: Array,
    default: () => [],
  },
  bookingId: {
    type: String,
    default: null,
  },
  tenantId: {
    type: String,
    default: null,
  },
});

const { formatDate } = useFormatting();

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

function getBookableTitle(bookableId) {
  if (!props.bookables || props.bookables.length === 0) {
    return "Unbekanntes Buchungsobjekt";
  }
  return (
    props.bookables.find((bookable) => bookable.id === bookableId)?.title ||
    "Unbekanntes Buchungsobjekt"
  );
}

async function downloadAttachment() {
  if (!props.isPaymentDocument) {
    return;
  }
  console.log("Downloading attachment", props.attachment);
  if (props.bookingId && props.tenantId) {
    let blob = null;
    if (props.attachment.type === "receipt") {
      blob = await useBookings().getBookingReceipt(
        props.tenantId,
        props.bookingId,
        props.attachment.name,
      );
    } else if (props.attachment.type === "invoice") {
      blob = await useBookings().getBookingInvoice(
        props.tenantId,
        props.bookingId,
        props.attachment.name,
      );
    }

    if (!blob) {
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      props.attachment.title ? props.attachment.title : props.attachment.name,
    );
    document.body.appendChild(link);
    link.click();
  } else {
    const notification = useNotification();
    notification.error(
      "Das Dokument konnte nicht heruntergeladen werden.",
      "Download fehlgeschlagen",
    );
  }
}
</script>

<style scoped></style>

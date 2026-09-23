<template>
  <div class="bg-primary/20 p-3 rounded mb-1 flex justify-between">
    <div class="text-gray-700 dark:text-gray-300">
      <p v-if="isPaymentDocument" class="text-sm">
        {{ attachmentType }}
      </p>
      {{ attachment.title }}
      <i18n-t
        v-if="!isPaymentDocument"
        keypath="booking.attachmentFor"
        tag="p"
        class="text-sm"
        scope="global"
      >
        <template #type>{{ attachmentType }}</template>
        <template #bookable>
          <span class="italic">{{
            getBookableTitle(attachment.bookableId)
          }}</span>
        </template>
      </i18n-t>
      <div v-if="!isPaymentDocument" class="mt-1 flex items-center">
        {{ $t("booking.accepted") }}
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
        {{ $t("booking.createdAt") }} {{ formatDate(attachment.timeCreated) }}
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


const { t } = useI18n();

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
      return t("booking.attachmentTypes.invoice");
    case "receipt":
      return t("booking.attachmentTypes.receipt");
    case "agreement":
      return t("booking.attachmentTypes.agreement");
    case "privacy-agreement":
      return t("booking.attachmentTypes.privacyAgreement");
    case "user-manual":
      return t("booking.attachmentTypes.userManual");
    case "security-information":
      return t("booking.attachmentTypes.securityInformation");
    case "product-information":
      return t("booking.attachmentTypes.productInformation");
    default:
      return t("booking.attachmentTypes.unknown");
  }
});

function getBookableTitle(bookableId) {
  if (!props.bookables || props.bookables.length === 0) {
    return t("booking.unknownBookable");
  }
  return (
    props.bookables.find((bookable) => bookable.id === bookableId)?.title ||
    t("booking.unknownBookable")
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
      t("booking.download.failedMessage"),
      t("booking.download.failedTitle"),
    );
  }
}
</script>

<style scoped></style>

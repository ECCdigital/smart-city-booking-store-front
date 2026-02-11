<template>
  <div class="" style="max-width: 800px">
    <UButton
      label="Zurück"
      icon="i-lucide-arrow-left"
      class="justify-center px-5 mt-2 bg-gray-300 text-black"
      :style="{ cursor: 'pointer' }"
      @click="$router.back()"
    />
    <h3 class="text-xl font-bold my-5">Buchungsdetails</h3>

    <!-- basis information -->
    <div class="flex mb-5">
      <div class="basis-1/2">
        <p class="font-medium">Buchungsnummer</p>
        <p>{{ booking.id }}</p>
      </div>
      <div class="basis-1/2">
        <p class="font-medium">Buchungsdatum</p>
        <p>{{ formatDate(booking.timeCreated) }}</p>
      </div>
    </div>
    <div class="flex mb-5">
      <div class="basis-1/2">
        <p class="font-medium">Mandant</p>
        <p>{{ tenantName }}</p>
      </div>
      <div class="">
        <p class="font-medium">Status</p>
        <BookingStatusChip :booking="booking" />
      </div>
    </div>
    <div v-if="booking.isRejected" class="mb-5">
      <p class="font-medium">Ablehnungsgrund</p>
      <p>{{ booking.rejectionReason }}</p>
    </div>
    <div v-if="bookingTimeSlot" class="mb-5">
      <div class="">
        <p class="font-medium">Buchungszeitraum</p>
        <p>{{ bookingTimeSlot[0] }} - {{ bookingTimeSlot[1] }}</p>
      </div>
    </div>

    <!-- bookable information  -->
    <div class="mb-5">
      <p class="font-medium">Gebuchte Objekte</p>
      <BookingDetailsBookableCard
        v-for="(bookable, i) in booking.bookableItems"
        :key="i"
        :bookable="bookable"
      />
    </div>

    <!-- payment information  -->
    <div class="mb-5">
      <p class="font-medium">Zahlungsinformationen</p>
      <div class="md:flex bg-gray-200 dark:bg-gray-800 p-3 rounded mb-3">
        <div class="md:basis-1/3 mb-5 md:mb-0">
          <p>Summe</p>
          <p class="font-bold text-primary">{{ bookingPrice }}</p>
        </div>
        <div class="flex md:basis-2/3">
          <div class="basis-1/2">
            <p>Zahlungsmethode</p>
            <p class="font-bold text-primary">{{ paymentMethode }}</p>
          </div>
          <div>
            <p>Status</p>
            <BookingPayedChip :booking-is-payed="booking.isPayed" />
          </div>
        </div>
      </div>
    </div>

    <!-- invoices and receipts  -->
    <div v-if="paymentDocuments.length > 0" class="mb-5">
      <p class="font-medium">Rechnungen und Zahlungsbelege</p>
      <BookingDetailsAttachmentCard
        v-for="(attachment, i) in paymentDocuments"
        :key="i"
        :attachment="attachment"
        is-payment-document
        :booking-id="booking.id"
        :tenant-id="booking.tenantId"
      />
    </div>

    <!-- attachments  -->
    <div v-if="otherDocuments.length > 0" class="mb-5">
      <p class="font-medium">Anhänge</p>
      <BookingDetailsAttachmentCard
        v-for="(attachment, i) in otherDocuments"
        :key="i"
        :attachment="attachment"
        :bookables="bookableTitles"
      />
    </div>

    <!-- comments  -->
    <div v-if="booking.comment" class="mb-5">
      <p class="font-medium">Ihr Kommentar</p>
      <p>{{ booking.comment }}</p>
    </div>
  </div>
</template>
<script setup>
import BookingDetailsBookableCard from "~/components/user/bookings/BookingDetailsBookableCard.vue";
import { useTenantStore } from "~~/stores/tenant.js";
import BookingStatusChip from "~/components/user/bookings/BookingStatusChip.vue";
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import BookingDetailsAttachmentCard from "~/components/user/bookings/BookingDetailsAttachmentCard.vue";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.booking.tenantId).name;
});
const bookingTimeSlot = computed(() => {
  if (props.booking.timeBegin && props.booking.timeEnd) {
    const beginn = formatDate(props.booking.timeBegin);
    const end = formatDate(props.booking.timeEnd);
    return [beginn, end];
  }
  return null;
});
const bookingPrice = computed(() => {
  if (props.booking.priceEur > 0) {
    return formatPrice(props.booking.priceEur);
  }
  return "0,00 €";
});

const paymentMethode = computed(() => {
  if (!props.booking.isPayed) {
    switch (props.booking.paymentProvider) {
      case "giroCockpit": {
        return "Online-Zahlung";
      }
      case "pmPayment": {
        return "Online-Zahlung";
      }
      case "invoice": {
        return "Rechnung";
      }
      default: {
        return "Unbekannt";
      }
    }
  } else {
    switch (props.booking.paymentMethode) {
      case "CASH":
        return "Bar";
      case "TRANSFER":
        return "Überweisung";
      case "CREDIT_CARD":
        return "Kreditkarte";
      case "DEBIT_CARD":
        return "EC-Karte";
      case "PAYPAL":
        return "PayPal";
      case "OTHER":
        return "Sonstiges";
      case "GIROPAY":
        return "Giropay";
      case "APPLE_PAY":
        return "Apple Pay";
      case "GOOGLE_PAY":
        return "Google Pay";
      case "EPS":
        return "EPS";
      case "IDEAL":
        return "iDEAL";
      case "MAESTRO":
        return "Maestro";
      case "PAYDIRECT":
        return "paydirekt";
      case "SOFORT":
        return "SOFORT-Überweisung";
      case "BLUECODE":
        return "Bluecode";
    }
  }
  return "Nicht angegeben";
});

const paymentDocuments = computed(() => {
  return props.booking.attachments.filter(
    (attachment) =>
      attachment.type === "invoice" || attachment.type === "receipt",
  );
});

const otherDocuments = computed(() => {
  return props.booking.attachments.filter(
    (attachment) =>
      attachment.type !== "invoice" && attachment.type !== "receipt",
  );
});

const bookableTitles = computed(() => {
  return props.booking.bookableItems.map((item) => ({
    title: item._bookableUsed.title,
    id: item._bookableUsed.id,
  }));
});

//help functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const formatPrice = (price) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};
</script>

<style scoped></style>

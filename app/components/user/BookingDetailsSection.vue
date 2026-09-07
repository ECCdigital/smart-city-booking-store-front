<template>
  <div class="mb-15" style="max-width: 800px">
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
        <p>{{ getTenantName(booking.tenantId) }}</p>
      </div>
      <div class="">
        <p class="font-medium">Status</p>
        <BookingStatusChip :booking="booking" />
      </div>
    </div>
    <div v-if="!isLive" class="mb-5">
      <p class="font-medium">{{ reasonHeading }}</p>
      <p>{{ booking.rejectionReason }}</p>
    </div>

    <div v-if="bookingTimeSlot || eventIds.length > 0" class="mb-5 flex">
      <div class="basis-1/2">
        <div class="flex space-x-1">
          <p v-if="bookingTimeSlot" class="font-medium">Buchungszeitraum</p>
          <p v-else-if="eventIds.length > 0" class="font-medium">
            Veranstaltungszeit
          </p>
          <UTooltip text="Als Termin herunterladen">
            <UButton
              icon="i-lucide-calendar-arrow-down"
              variant="soft"
              color="neutral"
              class="text-gray-700 dark:text-gray-300 cursor-pointer"
              @click="downloadAppointment()"
            />
          </UTooltip>
        </div>
        <p v-if="bookingTimeSlot">
          {{ bookingTimeSlot[0] }} - {{ bookingTimeSlot[1] }}
        </p>
        <div
          v-if="eventIds.length > 0 && events.length > 0"
          class="space-y-0.5"
        >
          <div
            v-for="event in events"
            :key="event.id"
            class="rounded-md bg-gray-200 p-1"
          >
            <span>{{ event.information.name }}</span>
            <EventTimeInformation :event="event" :use-icon="false" />
          </div>
        </div>
      </div>
    </div>

    <!-- bookable information  -->

    <div
      v-if="booking.bookableItems && booking.bookableItems.length > 0"
      class="mb-5"
    >
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
            <p class="font-bold text-primary">{{ paymentMethod }}</p>
          </div>
          <div v-if="!isFree">
            <p>Status</p>
            <BookingPayedChip :booking="booking" />
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
import { useTenantStore } from "~~/stores/tenant.js";
import BookingStatusChip from "~/components/user/bookings/BookingStatusChip.vue";
import BookingDetailsBookableCard from "~/components/user/bookings/BookingDetailsBookableCard.vue";
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import BookingDetailsAttachmentCard from "~/components/user/bookings/BookingDetailsAttachmentCard.vue";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { useIcalDownload } from "~/composables/api/useIcalDownload.js";
import { useEventStore } from "~~/stores/event.js";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import { isFreeBooking } from "~/utils/bookingPaymentStatus.js";
import {
  BOOKING_STATUS,
  isLiveBooking,
  isSettledBooking,
  resolveBookingStatus,
} from "~/utils/bookingStatus.js";

const { t } = useI18n();

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const eventStore = useEventStore();

const { formatDate, formatPrice } = useFormatting();
const { downloadBookingIcal } = useIcalDownload();
const { getTenantName } = useTenant();

const eventIds = computed(() => {
  return props.booking.bookableItems
    .filter((item) => item._bookableUsed.eventId)
    .map((item) => item._bookableUsed.eventId);
});

const events = ref([]);
watch(
  eventIds,
  async (newEventIds) => {
    if (newEventIds.length === 0) {
      events.value = [];
      return;
    }
    const nonredundantEventIds = [...new Set(newEventIds)];
    const fetchedEvents = [];
    for (const eventId of nonredundantEventIds) {
      const event = await eventStore.getEventById(eventId);
      if (event) {
        fetchedEvents.push(event);
      }
    }
    events.value = fetchedEvents;
  },
  { immediate: true },
);

const isLive = computed(() => isLiveBooking(props.booking));

// The backend writes rejectionReason for both states; a booking the
// customer cancelled themselves is not "rejected", so the heading follows
// the state.
const reasonHeading = computed(() =>
  resolveBookingStatus(props.booking) === BOOKING_STATUS.REJECTED
    ? t("account.bookingDetails.rejectionReason")
    : t("account.bookingDetails.cancellationReason"),
);

const bookingTimeSlot = computed(() => {
  if (props.booking.timeBegin && props.booking.timeEnd) {
    const beginn = formatDate(props.booking.timeBegin);
    const end = formatDate(props.booking.timeEnd);
    return [beginn, end];
  }
  return null;
});

const isFree = computed(() => isFreeBooking(props.booking));

const bookingPrice = computed(() => {
  if (isFree.value) {
    return t("booking.payment.free");
  }
  return formatPrice(props.booking.priceEur);
});

const paymentMethod = computed(() => {
  if (isFree.value) {
    return "–";
  }
  if (!isSettledBooking(props.booking)) {
    switch (props.booking.paymentProvider) {
      case "invoice": {
        return "Rechnung";
      }
      default: {
        return "–";
      }
    }
  } else {
    switch (props.booking.paymentMethod) {
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

async function downloadAppointment() {
  await downloadBookingIcal(props.booking.id, props.booking.tenantId);
}
</script>

<style scoped></style>

<template>
  <div class="flex flex-col" :class="bookingCardClasses">
    <!-- title and booking-id -->
    <div class="mb-3 h-1/3">
      <div class="flex justify-between">
        <span
          class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
        >
          #{{ booking.id }}
        </span>
        <UButton
          icon="i-lucide-ellipsis"
          class="rounded-3xl"
          variant="soft"
          color="neutral"
          @click="openDetails"
        />
      </div>

      <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2">
        {{ bookingTitle }}
      </h3>
    </div>

    <div class="flex flex-col h-2/3">
      <!-- time -->
      <div class="h-1/3 mb-3">
        <div
          v-if="bookingTimeSlot || event"
          class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1"
        >
          <UIcon name="i-lucide-clock" class="w-4 h-4 mr-1" />
          <span v-if="event && !bookingTimeSlot">Veranstaltungszeit</span>
          <span v-else>Zeitraum</span>
        </div>
        <div v-else class="h-[44px]" />
        <div v-if="bookingTimeSlot" class="text-sm font-medium">
          {{ bookingTimeSlot[0] }} - {{ bookingTimeSlot[1] }}
        </div>
        <EventTimeInformation
          v-else-if="eventId && event"
          :event="event"
          :use-icon="false"
          class="text-sm font-medium -mx-3"
        />
      </div>

      <!-- price -->
      <div class="mb-4">
        <div class="text-2xl font-bold text-primary">
          {{ bookingPrice }}
        </div>
      </div>

      <!-- Status Badges -->

      <div class="mb-2">
        <div class="text-sm text-medium text-gray-500 dark:text-gray-400 mb-1">
          Gebucht am: {{ booking.displayBookingDate }}
        </div>
        <div class="flex flex-wrap gap-2">
          <!-- status -->
          <BookingStatusChip :booking="booking" />

          <BookingPayedChip :booking-is-payed="booking.isPayed" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEventStore } from "~~/stores/event.js";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import BookingStatusChip from "~/components/user/bookings/BookingStatusChip.vue";
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";

const props = defineProps({
  booking: {
    type: Object,
    default: () => ({
      id: 0,
      objectName: "",
      from: "",
      to: "",
      price: 0,
      bookingStatus: "pending",
      paymentStatus: "unpaid",
    }),
  },
});

const eventStore = useEventStore();

const bookingTitle = computed(() => {
  if (props.booking.bookableItems && props.booking.bookableItems.length > 0) {
    return props.booking.bookableItems
      .map((item) => item._bookableUsed.title)
      .join(", ");
  }
  return props.booking.objectName;
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

//events
const eventId = computed(() => {
  return props.booking.bookableItems[0]?._bookableUsed.eventId || null;
});
const event = computed(() => {
  if (!eventId.value) {
    return null;
  }
  return eventStore.getEventById(eventId.value);
});

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

const formatPrice = (price) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
};

const bookingCardClasses =
  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg p-4 my-2 hover:shadow-lg transition-shadow";

function openDetails() {
  const router = useRouter();
  router.push({ path: `/user/bookings/${props.booking.id}` });
}
</script>

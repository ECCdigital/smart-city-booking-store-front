<template>
  <div
    class="flex flex-col cursor-pointer"
    :class="[
      bookingCardClasses,
      isActive
        ? 'border-2 border-primary/60 shadow-primary/20'
        : 'border border-gray-200 dark:border-gray-700',
    ]"
    @click="openDetails()"
  >
    <!-- title and booking-id -->
    <div class="mb-3 h-1/3">
      <div class="flex justify-between">
        <div class="flex">
          <div
            class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
          >
            #{{ booking.id }}
          </div>
          <div
            v-if="isActive"
            class="bg-primary/60 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2 py-1 rounded-full"
          >
            Aktiv
          </div>
        </div>
        <div @click.stop>
          <UDropdownMenu
            v-if="actionOptions && actionOptions.length"
            :items="actionOptions"
            :content="{
              align: 'end',
            }"
            :ui="{
              content: 'w-48 ring-0 shadow-lg glass',
              itemLeadingIcon: 'mt-1',
              item: 'before:bg-transparent data-highlighted:before:bg-transparent',
            }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              class="rounded-3xl"
              variant="soft"
              color="neutral"
            />
          </UDropdownMenu>
        </div>
      </div>

      <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2">
        {{ bookingTitle }}
      </h3>
    </div>

    <div class="flex flex-col flex-1 justify-between md:mb-2">
      <!-- Zeitraum -->
      <div
        v-if="bookingTimeSlot"
        class="flex items-center text-xs text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-lucide-clock" class="w-4 h-4 mr-1" />
        <span v-if="isEvent && !booking.timeBegin && !booking.timeEnd">
          Veranstaltungszeit
        </span>
        <span v-else> Zeitraum </span>
      </div>
      <div class="text-lg text-primary font-semibold leading-tight h-14">
        {{ bookingTimeSlot }}
      </div>

      <!-- Status -->
      <div class="flex flex-wrap gap-2 mb-3">
        <BookingStatusChip :booking="booking" />
        <BookingPayedChip v-if="!isFree" :booking="booking" />
      </div>

      <!-- Zusatzinformationen -->
      <div class="space-y-1">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Preis:
          <span class="font-medium text-gray-700 dark:text-gray-200">
            {{ bookingPrice }}
          </span>
        </div>

        <div class="text-sm text-gray-500 dark:text-gray-400">
          Gebucht am: {{ booking.displayBookingDate }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BookingStatusChip from "~/components/user/bookings/BookingStatusChip.vue";
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { useIcalDownload } from "~/composables/api/useIcalDownload.js";
import { isFreeBooking } from "~/utils/bookingPaymentStatus.js";

const { t } = useI18n();

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

const isFree = computed(() => isFreeBooking(props.booking));

const bookingPrice = computed(() => {
  if (isFree.value) {
    return t("booking.payment.free");
  }
  return formatPrice(props.booking.priceEur);
});

const { formatDate, formatPrice } = useFormatting();

const currentTime = ref(new Date().getTime());
const isActive = computed(() => {
  if (props.booking.isRejected) {
    return false;
  }
  if (props.booking.timeBegin && props.booking.timeEnd) {
    return (
      currentTime.value >= props.booking.timeBegin &&
      currentTime.value <= props.booking.timeEnd
    );
  }

  return false;
});

const { downloadBookingIcal } = useIcalDownload();
const actionOptions = computed(() => {
  const options = [];

  /*if(props.booking.lockerInfo.length > 0){
    options.push({
      label: "Schlüssel anzeigen",
      icon: "i-lucide-lock",
      onSelect: openMobileKey,
    });
  }*/

  if (isEvent.value || (props.booking.timeBegin && props.booking.timeEnd)) {
    options.push({
      label: "Termin herunterladen",
      icon: "i-lucide-calendar-arrow-down",
      onSelect: onDownloadIcal,
    });
  }

  return options;
});

const bookingTitle = computed(() => {
  if (props.booking.bookableItems && props.booking.bookableItems.length > 0) {
    return props.booking.bookableItems
      .map((item) => item._bookableUsed.title)
      .join(", ");
  }
  return props.booking.objectName;
});

const sameDayBookingDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

const sameDayBookingTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
});

function isSameCalendarDay(startDate, endDate) {
  return (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()
  );
}

const bookingTimeSlot = computed(() => {
  const startTime =
    props.booking.timeBegin && props.booking.timeEnd
      ? props.booking.timeBegin
      : props.booking.eventBegin && props.booking.eventEnd
        ? props.booking.eventBegin
        : null;

  const endTime =
    props.booking.timeBegin && props.booking.timeEnd
      ? props.booking.timeEnd
      : props.booking.eventBegin && props.booking.eventEnd
        ? props.booking.eventEnd
        : null;

  if (startTime && endTime) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isSameCalendarDay(startDate, endDate)) {
      return (
        sameDayBookingDateFormatter.format(startDate) +
        ", " +
        sameDayBookingTimeFormatter.format(startDate) +
        " - " +
        sameDayBookingTimeFormatter.format(endDate)
      );
    }

    return formatDate(startTime) + " - " + formatDate(endTime);
  }

  return null;
});

//events
const isEvent = computed(() => {
  return props.booking.bookableItems?.[0]?._bookableUsed?.eventId || false;
});

const bookingCardClasses =
  "bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 my-2 hover:shadow-lg transition-shadow";

function openDetails() {
  const router = useRouter();
  router.push({ path: `/account/bookings/${props.booking.id}` });
}
function onDownloadIcal() {
  downloadBookingIcal(props.booking.id, props.booking.tenantId);
}
function openMobileKey() {
  const router = useRouter();
  router.push({ path: `/account/keys/${props.booking.id}` });
}
</script>

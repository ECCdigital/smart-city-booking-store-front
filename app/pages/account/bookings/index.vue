<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader title="Ihre Buchungen" class="mb-3 md:mb-0" />
      <BookingSearchFilterArea
        :bookings="bookings"
        @update:bookings="setFilteredBookings"
      />
    </div>

    <div v-if="activeBookingsWithLocking?.length">
      <h2 class="text-xl font-bold">
        Aktuelle Buchungen mit Schließberechtigung
      </h2>
      <BookingSection
        :bookings="activeBookingsWithLocking"
        :use-pagination="activeBookingsWithLocking.length > 10"
      />

      <h2 class="mt-5 text-xl font-bold">Alle Buchungen</h2>
    </div>

    <BookingsSkeleton v-if="pending || isLoading" :skeleton-count="9" />
    <BookingSection
      v-else-if="filteredBookings?.length"
      :bookings="filteredBookings"
    />
    <BookingEmptyState v-else />
  </div>
</template>
<script setup>
import BookingSection from "~/components/user/BookingSection.vue";
import { useBookingStore } from "~~/stores/bookings.js";
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import BookingEmptyState from "~/components/user/bookings/BookingEmptyState.vue";
import BookingSearchFilterArea from "~/components/user/bookings/BookingSearchFilterArea.vue";
import { useEvents } from "~/composables/api/useEvents.js";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountBookings"));

const bookingsStore = useBookingStore();
const { fetchEventById } = useEvents();

const { data: enrichedBookings, pending } = useAsyncData(
  "bookings",
  async () => {
    await bookingsStore.fetchBookings();
    return await enrichBookingsWithEventDateTimes(bookingsStore.getBookings);
  },
);
const isLoading = ref(false);

const bookings = ref(bookingsStore.getBookings);
watch(enrichedBookings, (val) => {
  bookings.value = val;
});

const sortedBookings = computed(() =>
  [...bookings.value].sort((a, b) => b.timeCreated - a.timeCreated),
);

const filteredBookings = ref(null);

watch(
  sortedBookings,
  (val) => {
    filteredBookings.value = val;
  },
  { immediate: true },
);

function buildEventDateTime(date, time) {
  if (!date) {
    return null;
  }

  const dateTime = time ? `${date}T${time}` : `${date}T00:00:00`;
  const timestamp = new Date(dateTime).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

async function enrichBookingsWithEventDateTimes(bookings) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return bookings;
  }

  isLoading.value = true;
  const eventCache = new Map();

  const temp = await Promise.all(
    bookings.map(async (booking) => {
      const hasTimeBegin =
        booking.timeBegin !== null &&
        booking.timeBegin !== undefined &&
        booking.timeBegin !== "";
      const hasTimeEnd =
        booking.timeEnd !== null &&
        booking.timeEnd !== undefined &&
        booking.timeEnd !== "";

      if (hasTimeBegin && hasTimeEnd) {
        return booking;
      }

      const eventId = booking?.bookableItems?.[0]?._bookableUsed?.eventId;

      if (!eventId) {
        return booking;
      }

      if (!eventCache.has(eventId)) {
        eventCache.set(
          eventId,
          await fetchEventById(booking.tenantId, eventId),
        );
      }

      const event = eventCache.get(eventId);
      const eventInformation = event?.information;

      if (!eventInformation) {
        return booking;
      }

      return {
        ...booking,
        eventBegin: buildEventDateTime(
          eventInformation.startDate,
          eventInformation.startTime,
        ),
        eventEnd: buildEventDateTime(
          eventInformation.endDate,
          eventInformation.endTime,
        ),
      };
    }),
  );
  isLoading.value = false;
  return temp;
}

function setFilteredBookings(newBookings) {
  filteredBookings.value = newBookings.map((b) => ({ ...b }));
}

const activeBookingsWithLocking = computed(() => {
  const withLockerInfo = filteredBookings.value.filter(
    (booking) =>
      booking.lockerInfo.length > 0 &&
      booking.lockerInfo.some((info) => info.lockerSystem === "ifbs"),
  );

  const currentTime = new Date().getTime();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  return withLockerInfo.filter(
    (b) =>
      b.timeBegin - twoHoursMs < currentTime &&
      b.timeEnd + twoHoursMs > currentTime &&
      b.isRejected === false,
  );
});
</script>

<style scoped></style>

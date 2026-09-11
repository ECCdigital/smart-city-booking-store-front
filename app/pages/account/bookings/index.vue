<template>
  <div class="w-full">
    <PageHeader title="Meine Aktivitäten" class="mb-3 md:mb-0" />

    <div
      class="w-full my-2 mb-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6"
    >
      <QuickAccessCard
        icon="i-lucide-key-round"
        title="Digitale Schlüssel"
        description="Öffnen Sie Türen, Schließfächer oder Fahrradboxen mit Ihrem Smartphone."
        to="/mobile-key"
      />

      <!--
      <QuickAccessCard
        icon="i-lucide-book-heart"
        title="Favoriten"
        description="Häufig genutzte und gemerkte Buchungsobjekte schnell wieder buchen."
        to="/account/favorites"
      />
      -->

      <QuickAccessCard
        icon="i-lucide-wallet-cards"
        title="Rechnungen"
        description="Alle Rechnungen und Belege an einem Ort."
        to="/account/invoices"
      />
    </div>

    <!--
    toDo - bisher nur IFBS! Später noch für weitere Access Points erweitern
    <div v-if="activeBookingsWithLocking?.length">
      <h2 class="text-xl font-bold">
        Aktuelle Buchungen mit Schließberechtigung
      </h2>
      <BookingSection
        :bookings="activeBookingsWithLocking"
        :use-pagination="activeBookingsWithLocking.length > 10"
      />
    </div>
    -->
    <div class="md:flex justify-between items-center w-full mb-4">
      <h2 class="mt-5 text-xl font-bold">Meine Buchungen</h2>
      <BookingSearchFilterArea
        :bookings="bookings"
        @update:bookings="setFilteredBookings"
      />
    </div>

    <BookingsSkeleton v-if="pending" :skeleton-count="9" />
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
import { enrichBookingsWithEventDateTimes } from "~/utils/bookingEventTimes.js";
import { computed } from "vue";
import QuickAccessCard from "~/components/user/bookings/QuickAccessCard.vue";

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
    return await enrichBookingsWithEventDateTimes(
      bookingsStore.getBookings,
      fetchEventById,
    );
  },
);

// Derived from the async data, not copied out of the store: a `ref` of the
// store array plus watchers never updates during SSR (watchers do not run on
// the server), so the server rendered the empty state while the client
// rendered the cards. Vue keeps the server's classes on such a mismatched
// node, which left the card grid inside a stale empty-state/skeleton wrapper.
const bookings = computed(() => enrichedBookings.value ?? []);

const sortedBookings = computed(() =>
  [...bookings.value].sort((a, b) => b.timeCreated - a.timeCreated),
);

// `null` while no search/filter has narrowed the list.
const searchedBookings = ref(null);
const filteredBookings = computed(
  () => searchedBookings.value ?? sortedBookings.value,
);

function setFilteredBookings(newBookings) {
  searchedBookings.value = newBookings.map((b) => ({ ...b }));
}

//    toDo - bisher nur IFBS! Später noch für weitere Access Points erweitern
/*
const activeBookingsWithLocking = computed(() => {
  const withLockerInfo = sortedBookings.value.filter(
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
})
 */
</script>

<style scoped></style>

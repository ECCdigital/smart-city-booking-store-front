<template>
  <div class="w-full">
    <div class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6">
      <BookingCard
        v-for="booking in paginatedBookings"
        :key="booking.id"
        :booking="booking"
      />
    </div>

    <div v-if="usePagination" class="flex justify-center mt-2 mb-10">
      <UPagination
        v-model:page="currentPage"
        :items-per-page="itemsPerPage"
        :total="allBookings.length"
        :sibling-count="1"
        show-edges
      >
        <template #first>
          <span class="hidden" />
        </template>

        <template #last>
          <span class="hidden" />
        </template>
      </UPagination>
    </div>
  </div>
</template>
<script setup>
import BookingCard from "~/components/user/BookingCard.vue";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

const props = defineProps({
  bookings: {
    type: Array,
    required: false,
    default: null,
  },
  usePagination: {
    type: Boolean,
    default: true,
  },
});

const allBookings = computed(() =>
  [...props.bookings]
    .map((b) => ({
      ...b,
      displayBookingDate: new Date(b.timeCreated).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      statusLabel: b.isRejected
        ? "Storniert"
        : b.isCommitted
        ? "Bestätigt"
        : "Ausstehend",
      payedLabel: b.isPayed ? "bezahlt" : "nicht bezahlt",
    }))
);

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return allBookings.value.slice(start, end);
});

const { loadBundle } = useCatalogBundle();
const bundleLoaded = ref(false);

if (
  allBookings.value.some((booking) =>
    booking.bookableItems.some((item) => item._bookableUsed.type === "ticket")
  )
) {
  loadBundle({ include: ["events"] }).then(() => {
    bundleLoaded.value = true;
  });
}

//pagination
const { isGreaterThanLg } = useBreakpointCheck();
const currentPage = ref(1);
const itemsPerPage = computed(() => {
  if (isGreaterThanLg) {
    return 12;
  }
  return 10;
});

//events
/*async function getEventTime(eventId) {
  //toDo - build function to read event time from booking (upcoming)
  console.log("want to get event time for eventId ", eventId);
  return null;
}*/
</script>

<style scoped></style>

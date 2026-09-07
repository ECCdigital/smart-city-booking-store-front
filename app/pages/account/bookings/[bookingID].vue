<template>
  <div>
    <div class="flex justify-between mt-5 md:mt-0" style="max-width: 800px">
      <BackButton />
      <!--
      toDo - später Routing zu Schlüsseln ergänzen!
      <OpenIfbsKeyButton
        v-if="hasIfbsLockerInfo"
        :locker-info="booking.lockerInfo"
        :booking-id="booking.id"
        :tenant-id="booking.tenantId"
        :is-active="isActive"
      />
      -->
    </div>
    <PageHeader title="Buchungsdetails" class="my-5" />
    <EmergencyHelpAccordion
      v-if="booking"
      :tenant-id="booking.tenantId"
      :booking="booking"
      class="mb-5"
      style="max-width: 800px"
    />
    <BookingDetailsSection v-if="booking" :booking="booking" />
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingDetailsSection from "~/components/user/BookingDetailsSection.vue";
import BackButton from "~/components/BackButton.vue";
import EmergencyHelpAccordion from "~/components/mobileKey/EmergencyHelpAccordion.vue";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const bookingStore = useBookingStore();
await bookingStore.fetchBookings();

const route = useRoute();
const routeParams = computed(() => route.params);
const bookingID = computed(() => routeParams.value.bookingID);

const booking = computed(() => {
  if (!bookingID.value) {
    return null;
  }
  return bookingStore.getBookingById(bookingID.value);
});

const { t } = useI18n();
usePageTitle(() => {
  const itemTitle = booking.value?.bookableItems?.[0]?._bookableUsed?.title;
  return itemTitle
    ? t("meta.pages.bookableDetail", { title: itemTitle })
    : t("meta.pages.accountBookingDetail");
});

const currentTime = ref(new Date().getTime());
const isActive = computed(() => {
  if (booking.value.timeBegin && booking.value.timeEnd) {
    return (
      currentTime.value >= booking.value.timeBegin &&
      currentTime.value <= booking.value.timeEnd
    );
  }

  return false;
});
</script>
<style scoped></style>

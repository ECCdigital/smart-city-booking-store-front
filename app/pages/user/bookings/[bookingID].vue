<template>
<div>
  <div class="flex justify-between mt-5 md:mt-0" style="max-width: 800px">
    <BackButton/>
    <OpenMobileKeyButton
        v-if="hasIfbsLockerInfo"
        :locker-info="booking.lockerInfo"
        :booking-id="booking.id"
        :tenant-id="booking.tenantId"
    />
  </div>
  <PageHeader title="Buchungsdetails" class="my-5"/>
 <BookingDetailsSection v-if="booking" :booking="booking" />
</div>
</template>
<script setup>
import {useBookingStore} from "~~/stores/bookings.js";
import BookingDetailsSection from "~/components/user/BookingDetailsSection.vue";
import BackButton from "~/components/BackButton.vue";
import OpenMobileKeyButton from "~/components/mobileKey/OpenMobileKeyButton.vue";

definePageMeta({
  name: "bookings-booking-id",
  layout: "user",
  middleware: ["user-auth"],

});

const bookingStore = useBookingStore()
await bookingStore.fetchBookings();

const route = useRoute()
const routeParams = computed(() => route.params)
const bookingID = computed(() => routeParams.value.bookingID)

const booking = computed(() => {
  if(!bookingID.value) {
    return null
  }
  return bookingStore.getBookingById(bookingID.value)
})

const hasIfbsLockerInfo = computed(() => {
  if (!booking.value) {
    return false;
  }
  return booking.value.lockerInfo.some(info => info.lockerSystem === "ifbs")
});
</script>
<style scoped></style>
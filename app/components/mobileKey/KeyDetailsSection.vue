<template>
  <div>
    <div class="md:flex mb-5">
      <div class="basis-1/2">
        <div class="font-medium space-x-1">
          Buchungsnummer
          <UTooltip text="Zur Buchung gehen" class="ml-2">
            <UButton
              icon="i-lucide-square-arrow-out-up-right"
              variant="soft"
              class="text-gray-700 dark:text-gray-300 cursor-pointer"
              @click="goToBooking(booking.id)"
            />
          </UTooltip>
        </div>
        <p>{{ booking.id }}</p>
      </div>
      <div v-if="bookingTimeSlot" class="basis-1/2 mt-5 md:mt-0">
        <div class="font-medium flex">
          Buchungszeitraum
          <div
            v-if="isActive"
            class="bg-primary/60 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2 py-1 rounded-full ml-1"
          >
            Aktiv
          </div>
        </div>
        <p>{{ bookingTimeSlot[0] }} - {{ bookingTimeSlot[1] }}</p>
      </div>
    </div>
    <div class="mb-25">
      <p class="font-medium mb-2">Objekte mit Zugriff auf Schließanlagen</p>
      <KeyDetailsBookableCard
        v-for="(info, i) in booking.lockerInfo"
        :key="i"
        :bookable="getBookableForKey(info.bookableId)"
        :locker-info="info"
        :booking-id="booking.id"
        :is-active="isActive"
      />
    </div>
  </div>
</template>
<script setup>
import {useFormatting} from "~/composables/utils/useFormatting.js";
import KeyDetailsBookableCard from "~/components/mobileKey/KeyDetailsBookableCard.vue";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});
const { formatDate } = useFormatting();

const bookingTimeSlot = computed(() => {
  if (props.booking.timeBegin && props.booking.timeEnd) {
    const beginn = formatDate(props.booking.timeBegin);
    const end = formatDate(props.booking.timeEnd);
    return [beginn, end];
  }
  return null;
});
const currentTime = ref(new Date().getTime());
const isActive = computed(() => {
  if (props.booking.timeBegin && props.booking.timeEnd) {
    return (
      currentTime.value >= props.booking.timeBegin &&
      currentTime.value <= props.booking.timeEnd
    );
  }

  return false;
});

function getBookableForKey(id) {
  return props.booking.bookableItems.find((b) => b.bookableId === id);
}
function goToBooking(bookingId) {
  const router = useRouter();
  router.push({ path: `/account/bookings/${bookingId}` });
}
</script>

<style scoped></style>

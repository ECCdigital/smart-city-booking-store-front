<template>
  <div class="w-full pb-25">
    <!--Current Keys -->
    <p v-if="allLockerBookings.length > 0" class="mt-2 mb-5">
      Hier finden Sie Ihre Buchungen mit Schließsystem-Zugriff.
    </p>
    <div v-if="currentLockerBookings.length > 0">
      <h2 class="text-xl font-bold">Aktuelle Schlüssel</h2>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4"
      >
        <KeyCardIfbs
          v-for="booking in currentLockerBookings"
          :key="booking.id"
          :booking="booking"
        />
      </div>
    </div>

    <!--Upcoming Keys -->
    <div v-if="upcomingLockerBookings.length > 0">
      <h2 class="text-xl font-bold">Kommende Schlüssel</h2>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4"
      >
        <KeyCardIfbs
          v-for="booking in upcomingLockerBookings"
          :key="booking.id"
          :booking="booking"
        />
      </div>
    </div>

    <!--Past Keys -->
    <div v-if="expiredLockerBookings.length > 0">
      <div class="flex space-x-1">
        <h2 class="text-xl font-bold">Ausgelaufene Schlüssel</h2>
        <UButton
          :icon="showExpiredKeys ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :label="showExpiredKeys ? 'Ausblenden' : 'Anzeigen'"
          color="neutral"
          variant="soft"
          @click="
            () => {
              showExpiredKeys = !showExpiredKeys;
            }
          "
        />
      </div>
      <div
        v-if="showExpiredKeys"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-4"
      >
        <KeyCardIfbs
          v-for="booking in expiredLockerBookings"
          :key="booking.id"
          :booking="booking"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="allLockerBookings.length === 0" class="text-center py-8">
      <UIcon
        name="i-lucide-key-round"
        :size="40"
        class="text-gray-400 dark:text-gray-500"
      />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Keine aktiven Schlüssel
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Es gibt derzeit keine Buchungen mit Schließsystem-Zugriff für
        Fahrradboxen.
      </p>
    </div>
  </div>
</template>
<script setup>
import KeyCardIfbs from "~/components/mobileKey/KeyCardIfbs.vue";

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
});

// bookings with ifbs-lockerInfo
const allLockerBookings = computed(() => {
  return props.bookings.filter((booking) => {
    return (
      booking.isRejected === false &&
      booking.lockerInfo &&
      Array.isArray(booking.lockerInfo) &&
      booking.lockerInfo.some((info) => info.lockerSystem === "ifbs")
    );
  });
});

const currentTime = ref(new Date().getTime());
const twoHoursMs = ref(2 * 60 * 60 * 1000);
const currentLockerBookings = computed(() => {
  return allLockerBookings.value.filter((booking) => {
    if (booking.timeBegin && booking.timeEnd) {
      return (
        booking.timeBegin - twoHoursMs.value < currentTime.value &&
        booking.timeEnd + twoHoursMs.value > currentTime.value
      );
    }
  });
});

const upcomingLockerBookings = computed(() => {
  return allLockerBookings.value.filter((booking) => {
    if (booking.timeBegin && booking.timeEnd) {
      return booking.timeBegin > currentTime.value + twoHoursMs.value;
    }
  });
});

const expiredLockerBookings = computed(() => {
  return allLockerBookings.value.filter((booking) => {
    if (booking.timeBegin && booking.timeEnd) {
      return booking.timeEnd < currentTime.value - twoHoursMs.value;
    }
  });
});
const showExpiredKeys = ref(false);
onMounted(() => {
  if (
    currentLockerBookings.value.length === 0 &&
    upcomingLockerBookings.value.length === 0 &&
    expiredLockerBookings.value.length > 0
  ) {
    showExpiredKeys.value = true;
  }
});
</script>

<style scoped></style>

<template>
  <div class="w-full">
    <!--Current Keys -->
    <div v-if="currentLockerBookings.length > 0">
      <h2 class="text-xl font-bold">Aktuelle Schlüssel</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KeyCardIfbs
          v-for="booking in upcomingLockerBookings"
          :key="booking.id"
          :booking="booking"
        />
      </div>
    </div>

    <!--Past Keys -->
    <div v-if="expiredLockerBookings.length > 0">
      <div class="flex">
        <h2 class="text-xl font-bold">Ausgelaufene Schlüssel</h2>
        <UButton
          :icon="showExpiredKeys ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          :label="showExpiredKeys ? 'Ausblenden' : 'Anzeigen'"
          color="neutral"
          variant="soft"
          @click="() => {showExpiredKeys = !showExpiredKeys}"
        />
      </div>
      <div v-if="showExpiredKeys" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KeyCardIfbs
          v-for="booking in expiredLockerBookings"
          :key="booking.id"
          :booking="booking"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <div
        class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6"
      >
        <UIcon
          name="i-lucide-key"
          class="w-12 h-12 text-gray-400 dark:text-gray-500"
        />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Keine aktiven Schließberechtigungen
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Es gibt derzeit keine Buchungen mit IFBS-Schließsystem Zugriff.
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
</script>

<style scoped></style>

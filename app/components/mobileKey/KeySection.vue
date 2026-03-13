<template>
  <div class="w-full">

    <!-- Mobile Keys Karten -->
    <div v-if="filteredLockerBookings.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <KeyCardIfbs
v-for="booking in filteredLockerBookings"
               :key="booking.id"
:booking="booking"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <div class="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
        <UIcon name="i-lucide-key" class="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Keine aktiven Schließberechtigungen</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">Es gibt derzeit keine Buchungen mit IFBS-Schließsystem Zugriff.</p>
    </div>
  </div>
</template>
<script setup>
import KeyCardIfbs from "~/components/mobileKey/KeyCardIfbs.vue";

const props = defineProps({
  bookings: {
    type: Array,
required: true
  }
})



// Gefilterte Buchungen mit IFBS Locker System
const filteredLockerBookings = computed(() => {
  return props.bookings.filter(booking => {
    return booking.lockerInfo &&
        Array.isArray(booking.lockerInfo) &&
        booking.lockerInfo.some(info => info.lockerSystem === 'ifbs')
  })
})


</script>


<style scoped>
/*.booking-card {
  @apply transform hover:-translate-y-1;
}*/

/*.booking-card:hover .bg-gradient-to-r {
  @apply shadow-lg;
}*/
</style>
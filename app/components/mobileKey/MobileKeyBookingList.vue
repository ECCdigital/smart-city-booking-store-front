<template>
  <UCard v-for="booking in bookings" :key="booking.id">
    <template #header>
      <!-- Status -->
      <div class="flex justify-end">
        <div
            class="flex px-3 py-1 rounded-full text-xs font-medium w-max"
            :class="bookingStatus(booking).color"
        >
          <UIcon
              :name="bookingStatus(booking).icon"
              class="w-4 h-4 mr-1 mt-0.5"
          />
          {{ bookingStatus(booking).label }}
        </div>
      </div>
      <!-- Title and Tenant -->
      <div class="flex gap-3 items-center">
        <div
            class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10"
        >
          <UIcon
              name="i-lucide-key"
              class="w-5 h-5 text-primary font-bold"
          />
        </div>

        <div class="basis-6/7">
          <h2
              class="font-semibold line-clamp-2"
              :class="
                  booking.leadBookable?.title.length > 40 ? '' : 'text-lg'
                "
          >
            {{
              booking.leadBookable?.title || "Unbekanntes Buchungsobjekt"
            }}
          </h2>
          <p class="text-sm text-neutral-500">
            #{{ booking.id }} &middot; Tenant:
            {{ getTenantName(booking.tenantId) }}
          </p>
        </div>
      </div>

      <!-- Time and Address -->
      <div class="mt-5 flex flex-col gap-3">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="basis-full sm:basis-1/2 flex items-center">
            <UIcon
                name="i-lucide-calendar"
                class="basis-1/10 sm:basis-auto w-4 h-4 m-0.5 mr-2"
            />
            <p class="text-sm text-neutral-500">
              {{ formatDate(booking.timeBegin) }} bis
              {{ formatDate(booking.timeEnd) }}
            </p>
          </div>
          <div
              class="basis-full sm:basis-1/2 flex items-center order-2 md:order-1"
          >
            <UIcon
                name="i-lucide-door-closed"
                class="basis-1/10 sm:basis-auto w-4 h-4 m-0.5 mr-2"
            />
            <p class="text-sm text-neutral-500">
              {{ booking.accessPoints.length }}
              {{ booking.accessPoints.length === 1 ? "Tür" : "Türen" }}
            </p>
          </div>
        </div>
        <div>
          <div class="w-full flex items-center order-1 md:order-2">
            <UIcon
                name="i-lucide-map-pin-house"
                class="basis-1/10 sm:basis-auto w-4 h-4 m-0.5 mr-2"
            />
            <p class="text-sm text-neutral-500">
              {{
                booking.leadBookable.location.display_address ||
                "Keine Adresse angegeben"
              }}
            </p>
          </div>
        </div>
      </div>
    </template>



    <div v-for="accessPoint in booking.accessPoints" :key="accessPoint.id">
      {{accessPoint.id }} - {{accessPoint.provider}}: {{accessPoint.type}} "{{accessPoint.label}}"
    </div>
    <USeparator color="primary" type="solid" size="md" class="w-full" />
  </UCard>
</template>
<script setup>
const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
});

const { getTenantName } = useTenant();

const bookingStatus = (booking) => {
  const now = Date.now();

  if (booking.timeBegin && now < booking.timeBegin) {
    return {
      label: "Kommend",
      color: "bg-yellow-100 text-yellow-800",
      icon: "i-lucide-clock",
    };
  }

  if (booking.timeEnd && now > booking.timeEnd) {
    return {
      label: "Vergangen",
      color: "bg-gray-100 text-gray-800",
      icon: "i-lucide-clock",
    };
  }

  return {
    label: "Aktiv",
    color: "bg-green-100 text-green-800",
    icon: "i-lucide-check",
  };
};
</script>
<style scoped></style>

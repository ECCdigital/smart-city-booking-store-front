<template>
  <div
    class="flex flex-col booking-card"
    :class="[
      keyCardClasses,
      isActive
        ? 'border-2 border-primary/60 shadow-primary/20'
        : 'border border-gray-200 dark:border-gray-700',
    ]"
  >
    <!-- Title and booking-id (h-1/3) -->
    <div class="mb-3 h-2/5 ">
      <div class="flex justify-between">
        <div class="flex flex-wrap gap-2 items-center">
          <UTooltip :text="`Buchungs-ID: ${booking.id}`">
            <div
                class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
            >
              #{{ booking.id }}
            </div>
          </UTooltip>
          <div
              v-if="isActive"
            class="bg-primary/60 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2 py-1 rounded-full"
          >
            Aktiv
          </div>
        </div>
        <UButton
          icon="i-lucide-key-round"
          class="rounded-3xl"
          variant="soft"
          color="neutral"
        />
      </div>

      <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2 mt-2">
        Fahrradbox
        <span v-for="(info, index) in booking.lockerInfo" :key="index">
          {{ info.ifbsMetadata?.nummer
            ? (index === booking.lockerInfo.length - 2
                ? `#${info.ifbsMetadata.nummer} & `
                : index < booking.lockerInfo.length - 2
                  ? `#${info.ifbsMetadata.nummer}, `
                  : `#${info.ifbsMetadata.nummer} `)
            : "" }}
        </span>
      </h3>
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-3 mt-1">
          Box-ID
          <span v-for="(info, index) in booking.lockerInfo" :key="index">
          {{ info.ifbsMetadata?.boxId
              ? (index === booking.lockerInfo.length - 2
                  ? `#${info.ifbsMetadata.boxId} & `
                  : index < booking.lockerInfo.length - 2
                      ? `#${info.ifbsMetadata.boxId}, `
                      : `#${info.ifbsMetadata.boxId} `)
              : "" }}
        </span>
        </div>
    </div>

    <div class="flex flex-col h-3/5 px-4 mt-3">
      <div class="h-1/2 mb-3 ">
        <div
          class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1"
        >
          <UIcon name="i-lucide-clock" class="w-4 h-4 mr-1" />
          <span>Zeitraum</span>
        </div>
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatDate(booking.timeBegin) }} -
          {{ formatDate(booking.timeEnd) }}
        </div>
      </div>

      <div class="h-1/2 grid justify-center content-center ">
        <!-- Haupt-Action Button -->
        <OpenIfbsKeyButton
          :tenant-id="booking.tenantId"
          :booking-id="booking.id"
          :locker-info="booking.lockerInfo"
          :is-active="isActive"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import OpenIfbsKeyButton from "~/components/mobileKey/OpenIfbsKeyButton.vue";
import {useFormatting} from "~/composables/utils/useFormatting.js";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const { formatDate } = useFormatting();


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

const keyCardClasses =
    "bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 my-2 hover:shadow-lg transition-shadow";

</script>

<style scoped></style>

<template>
  <UCard class="rounded-lg">
    <div class="flex items-start gap-3">
      <div
        class="flex shrink-0 items-center justify-center rounded-lg w-9 h-9"
        :class="isOpen ? 'bg-green-600/10' : 'bg-primary/10'"
      >
        <UIcon
          :name="isOpen ? 'i-lucide-unlock' : 'i-lucide-lock'"
          class="w-5 h-5"
          :class="isOpen ? 'text-green-600' : 'text-primary'"
        />
      </div>

      <div class="min-w-0">
        <p class="font-semibold line-clamp-2">
          {{ title }}
        </p>

        <p v-if="showMode" class="text-sm text-neutral-500 mt-1">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="mode.color"
          >
            <UIcon :name="mode.icon" class="w-3.5 h-3.5" />
            {{ mode.label }}
          </span>
        </p>

        <p v-if="locationLine" class="text-sm text-neutral-500 line-clamp-2">
          {{ locationLine }}
        </p>

        <p v-if="booking" class="text-sm mt-2">
          <span class="text-neutral-500"
            >Buchung #{{ booking.id }} &middot;
          </span>
          <span class="text-primary font-semibold">{{ timeRange }}</span>
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";

const MODES = Object.freeze({
  remote: {
    label: "Per Knopf",
    color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    icon: "i-lucide-lock-open",
  },
  code: {
    label: "Code an der Tür",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    icon: "i-lucide-key-round",
  },
});

const UNKNOWN_MODE = Object.freeze({
  label: "Unbekannter Modus",
  color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  icon: "i-lucide-alert-triangle",
});

const props = defineProps({
  accessPoint: {
    type: Object,
    default: null,
  },
  booking: {
    type: Object,
    default: null,
  },
  /** From the last known status - the card says lock or unlock accordingly. */
  isOpen: {
    type: Boolean,
    default: false,
  },
  showMode: {
    type: Boolean,
    default: false,
  },
});

const { formatDateRange } = useFormatting();

/**
 * A locker has no name a person would recognise, so it is named by the
 * booking behind it. Which kind it is comes from `type` - the provider does
 * not decide how a thing is called.
 */
const title = computed(() => {
  if (props.accessPoint?.type === "locker") {
    return `Fahrradbox #${props.accessPoint.externalBookingId}`;
  }

  return props.accessPoint?.label || "Unbekannte Tür";
});

const mode = computed(() => MODES[props.accessPoint?.mode] || UNKNOWN_MODE);

const locationLine = computed(
  () => props.booking?.leadBookable?.location?.display_address || "",
);

const timeRange = computed(() =>
  formatDateRange(props.booking?.timeBegin, props.booking?.timeEnd),
);
</script>

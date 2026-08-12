<template>
  <UCard class="rounded-lg">
    <div class="flex items-start gap-3">
      <div
        class="flex shrink-0 items-center justify-center rounded-lg w-9 h-9 bg-primary/10"
      >
        <UIcon name="i-lucide-door-closed" class="w-5 h-5 text-primary" />
      </div>

      <div class="min-w-0">
        <p class="font-semibold line-clamp-2">
          {{ accessPoint?.label || "Unbekannte Tür" }}
        </p>
        <p v-if="locationLine" class="text-sm text-neutral-500 line-clamp-2">
          {{ locationLine }}
        </p>
        <p v-if="booking" class="text-sm mt-2">
          <span class="text-neutral-500">Buchung #{{ booking.id }} &middot; </span>
          <span class="text-primary font-semibold">{{ timeRange }}</span>
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  accessPoint: {
    type: Object,
    default: null,
  },
  booking: {
    type: Object,
    default: null,
  },
});

const { formatDateRange } = useFormatting();

const locationLine = computed(
  () => props.booking?.leadBookable?.location?.display_address || "",
);

const timeRange = computed(() =>
  formatDateRange(props.booking?.timeBegin, props.booking?.timeEnd),
);
</script>

<template>
  <!--
    Two shapes, one door. The full card is what a page puts above the flow; the
    compact one is what the panel puts in its header, where a slideover has
    400 px to spend on a phone and the address and the booking number already
    stand in the list row the panel was opened from.
  -->
  <component
    :is="compact ? 'div' : 'UCard'"
    :class="compact ? 'w-full min-w-0' : 'rounded-lg'"
  >
    <div class="flex gap-3" :class="compact ? 'items-center' : 'items-start'">
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
        <p
          class="font-semibold line-clamp-2"
          :class="compact ? 'text-sm leading-tight' : ''"
        >
          {{ title }}
        </p>

        <!--
          The Access Window, then the code hint - in the full card only; the
          compact header has no second line to spend.
        -->
        <div v-if="accessPoint && !compact" class="text-sm text-neutral-500">
          <AccessWindowLine :access-point="accessPoint" />
        </div>
        <p
          v-if="needsCodeAtDoor(accessPoint) && !compact"
          class="text-sm text-neutral-500"
        >
          {{ t("mobileKey.accessPoint.codeHint") }}
        </p>

        <p
          v-if="locationLine && !compact"
          class="text-sm text-neutral-500 line-clamp-2"
        >
          {{ locationLine }}
        </p>

        <p v-if="booking && compact" class="text-xs text-primary font-semibold truncate">
          {{ timeRange }}
        </p>

        <p v-else-if="booking" class="text-sm mt-2">
          <span class="text-neutral-500"
            >Buchung #{{ booking.id }} &middot;
          </span>
          <span class="text-primary font-semibold">{{ timeRange }}</span>
        </p>
      </div>
    </div>
  </component>
</template>

<script setup>
import AccessWindowLine from "~/components/mobileKey/AccessWindowLine.vue";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import {
  accessPointTitle,
  needsCodeAtDoor,
} from "~/utils/accessPointDisplay.js";

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
  /**
   * The one-line shape for a panel header: no shell, no address, no booking
   * number - the door and when it is yours, and nothing that costs a second
   * line. Everything it leaves out stands in the list row behind the panel.
   */
  compact: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const { formatDateRange } = useFormatting();

const title = computed(() => accessPointTitle(props.accessPoint));

const locationLine = computed(
  () => props.booking?.leadBookable?.location?.display_address || "",
);

const timeRange = computed(() =>
  formatDateRange(props.booking?.timeBegin, props.booking?.timeEnd),
);
</script>

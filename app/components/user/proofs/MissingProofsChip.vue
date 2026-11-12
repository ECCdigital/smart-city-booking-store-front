<template>
  <!-- Required proofs still missing: the number
       and the earliest deadline; a click leads to the page „Nachweise
       einreichen“ at the most urgent field, unless the chip stands in a
       link of its own (`linked` off). Renders nothing otherwise. -->
  <component
    :is="linked ? NuxtLink : 'span'"
    v-if="chip"
    v-bind="
      linked
        ? { to: proofPageLink(booking.id, mostUrgentProofFieldOf(booking)) }
        : {}
    "
    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
    :class="chipClass"
    @click="linked && $event.stopPropagation()"
  >
    <UIcon name="i-lucide-file-clock" class="w-4 h-4 mr-1 shrink-0" />
    {{ label }}
  </component>
</template>
<script setup>
import {
  missingProofsChipOf,
  mostUrgentProofFieldOf,
  proofPageLink,
} from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
  /** Off where the chip stands in a link of its own, as in the dialog of the banner. */
  linked: {
    type: Boolean,
    default: true,
  },
});

const NuxtLink = resolveComponent("NuxtLink");

const { t } = useI18n();
const { formatDay } = useFormatting();

const chip = computed(() => missingProofsChipOf(props.booking));

// The colours of the other badges of the card: amber while open, like an
// open cancellation request, red once overdue.
const chipClass = computed(() =>
  chip.value?.color === "error"
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
);

const label = computed(() =>
  t(
    chip.value.labelKey,
    {
      count: chip.value.count,
      deadline: chip.value.deadline ? formatDay(chip.value.deadline) : "",
    },
    chip.value.count,
  ),
);
</script>

<template>
  <UBadge
    v-if="view.color === 'warning'"
    color="neutral"
    :variant="variant"
    :class="[
      'bg-orange-500/10 text-orange-500',
      framed ? 'ring-orange-500/25' : '',
    ]"
    :label="label"
  />
  <UBadge v-else :color="view.color" :variant="variant" :label="label" />
</template>
<script setup>
import { customerUploadFieldView } from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

/**
 * The state of one upload field as a chip: open
 * with deadline and days left, submitted, rejected, overdue, or checked with
 * its date and, where its file is gone, the note that it is deleted.
 */
const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  /** With the frame of the other badges; without, as in a line of text. */
  framed: {
    type: Boolean,
    default: true,
  },
});

const variant = computed(() => (props.framed ? "subtle" : "soft"));

const { t } = useI18n();
const { formatDay } = useFormatting();

const view = computed(() => customerUploadFieldView(props.field));

const label = computed(() => {
  const { deadline, days, reviewedAt } = view.value.labelParams;
  return t(
    view.value.labelKey,
    {
      deadline: deadline ? formatDay(deadline) : "",
      days: days ?? 0,
      reviewedAt: reviewedAt ? formatDay(reviewedAt) : "",
    },
    days ?? 0,
  );
});
</script>

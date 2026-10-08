<template>
  <!--
    A cancellation request still open by email (a `REJECT` hook on a live
    booking), with the day it was made. Renders nothing otherwise, so a
    booking that was cancelled meanwhile loses the hint even where the hook
    remains.
  -->
  <div
    v-if="request"
    class="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
  >
    <UIcon name="i-lucide-mail" class="w-4 h-4 mr-1 shrink-0" />
    {{ label }}
  </div>
</template>
<script setup>
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { openCancellationRequestOf } from "~/utils/bookingCancellation.js";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
  shortMode: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const { localeTag } = useFormatting();

const request = computed(() => openCancellationRequestOf(props.booking));

const label = computed(() => {
  if (props.shortMode) {
    return t("booking.cancellation.openRequestShort");
  }
  const timeCreated = request.value?.timeCreated;
  if (!timeCreated) {
    return t("booking.cancellation.openRequestOn", {
      date: new Date(timeCreated).toLocaleDateString(localeTag()),
    });
  }
  return t("booking.cancellation.openRequestOn", {
    date: new Date(timeCreated).toLocaleDateString(localeTag()),
  });
});
</script>

<style scoped></style>

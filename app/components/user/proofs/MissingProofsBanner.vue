<template>
  <!-- Bookings with required proofs still missing:
       how many, the next deadline, and the way to the page „Nachweise
       einreichen“. Renders nothing while none is missing. -->
  <UAlert
    v-if="banner"
    :color="banner.overdue && !banner.nextDeadline ? 'error' : 'warning'"
    variant="subtle"
    icon="i-lucide-file-clock"
    :title="t('customerUploads.missingBanner.title', banner.bookingCount)"
    :description="description"
    :actions="[
      {
        label: t('customerUploads.submitNow'),
        to: '/account/proofs',
        icon: 'i-lucide-upload',
        color: 'primary',
        variant: 'solid',
        size: 'md',
      },
    ]"
    :orientation="isSmUp ? 'horizontal' : 'vertical'"
  />
</template>
<script setup>
import { useMediaQuery } from "@vueuse/core";
import { missingProofsBannerOf } from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  bookings: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();
const { formatDay } = useFormatting();

// The button beside the text from `sm` on, below it on a phone, where it
// would squeeze the title.
const isSmUp = useMediaQuery("(min-width: 640px)");

const banner = computed(() => missingProofsBannerOf(props.bookings));

const description = computed(() => {
  if (banner.value.nextDeadline) {
    return t("customerUploads.missingBanner.nextDeadline", {
      deadline: formatDay(banner.value.nextDeadline),
    });
  }
  return t("customerUploads.missingBanner.overdue");
});
</script>

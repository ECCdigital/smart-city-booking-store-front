<template>
  <!-- Bookings with required proofs still missing:
       how many, the next deadline, and „Jetzt einreichen“, which opens the
       choice of the booking. Renders nothing while none is missing. -->
  <div v-if="banner">
    <UAlert
      :color="banner.overdue && !banner.nextDeadline ? 'error' : 'warning'"
      variant="subtle"
      icon="i-lucide-file-clock"
      :title="t('customerUploads.missingBanner.title', banner.bookingCount)"
      :description="description"
      :actions="[
        {
          label: t('customerUploads.submitNow'),
          icon: 'i-lucide-upload',
          color: 'primary',
          variant: 'solid',
          size: 'md',
          onClick: () => (choosing = true),
        },
      ]"
      :orientation="isSmUp ? 'horizontal' : 'vertical'"
    />

    <!-- The bookings to choose from, the most urgent first: one line each
       with title, number and period, and the missing proofs with their
       deadline. A choice opens the page „Nachweise einreichen“ for it. -->
    <UModal
      v-model:open="choosing"
      :title="t('customerUploads.chooseBooking.title')"
      :description="t('customerUploads.chooseBooking.text')"
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #body>
        <ul
          class="divide-y divide-gray-200 dark:divide-gray-700 -my-2"
          data-test="proof-booking-choice"
        >
          <li v-for="entry in missing" :key="entry.booking.id">
            <NuxtLink
              :to="proofPageLink(entry.booking.id)"
              class="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-primary"
              @click="choosing = false"
            >
              <div
                class="min-w-0 flex-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div class="min-w-0">
                  <p class="flex items-baseline gap-2 min-w-0">
                    <span class="font-semibold truncate">
                      {{ titleOf(entry.booking) }}
                    </span>
                    <span
                      class="text-xs text-gray-500 whitespace-nowrap shrink-0"
                    >
                      #{{ entry.booking.id }}
                    </span>
                  </p>
                  <p
                    v-if="entry.booking.timeBegin"
                    class="text-xs text-gray-600 dark:text-gray-400"
                  >
                    {{ periodOf(entry.booking) }}
                  </p>
                </div>
                <MissingProofsChip
                  :booking="entry.booking"
                  :linked="false"
                  class="self-start sm:self-auto shrink-0"
                />
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="w-4 h-4 shrink-0 text-gray-400"
              />
            </NuxtLink>
          </li>
        </ul>
      </template>
    </UModal>
  </div>
</template>
<script setup>
import { useMediaQuery } from "@vueuse/core";
import MissingProofsChip from "~/components/user/proofs/MissingProofsChip.vue";
import {
  missingProofBookingsOf,
  missingProofsBannerOf,
  proofBookingTitleOf,
  proofPageLink,
} from "~/utils/customerUploads.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  bookings: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();
const { formatDay, formatDate, formatTime } = useFormatting();

// The button beside the text from `sm` on, below it on a phone, where it
// would squeeze the title.
const isSmUp = useMediaQuery("(min-width: 640px)");

const banner = computed(() => missingProofsBannerOf(props.bookings));
const missing = computed(() => missingProofBookingsOf(props.bookings));

const choosing = ref(false);

const description = computed(() => {
  if (banner.value.nextDeadline) {
    return t("customerUploads.missingBanner.nextDeadline", {
      deadline: formatDay(banner.value.nextDeadline),
    });
  }
  return t("customerUploads.missingBanner.overdue");
});

/** The period, its day named once where it begins and ends on the same day. */
function periodOf({ timeBegin, timeEnd }) {
  if (!timeEnd) return formatDate(timeBegin);
  const [from, to] = [new Date(timeBegin), new Date(timeEnd)];
  if (from.toDateString() === to.toDateString()) {
    return `${formatDay(from)}, ${formatTime(from)} – ${formatTime(to)}`;
  }
  return `${formatDate(timeBegin)} – ${formatDate(timeEnd)}`;
}

const titleOf = (booking) =>
  proofBookingTitleOf(booking) || t("booking.unknownBookable");
</script>

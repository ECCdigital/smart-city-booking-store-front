<template>
  <div>
    <!--
      The direct cancellation: a button on a live booking whose end has not
      passed, greyed with the tenant's contact hint where the policy forbids
      it. A request still open by email (a `REJECT` hook) only adds a note
      above the button; the booking can still be cancelled here directly.
    -->
    <div
      v-if="cancellation !== CANCELLATION_AVAILABILITY.HIDDEN"
      class="mb-5 flex flex-col items-start gap-3"
    >
      <p
        v-if="openCancellationRequest"
        class="flex gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 max-w-lg"
      >
        <UIcon name="i-lucide-info" class="w-4.5 h-4.5 shrink-0 mt-0.5" />
        <span>{{ openRequestNote }}</span>
      </p>
      <UTooltip
        :text="cancellationBlockedHint"
        :disabled="cancellation !== CANCELLATION_AVAILABILITY.BLOCKED"
      >
        <span class="inline-block">
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-calendar-x"
            :disabled="cancellation === CANCELLATION_AVAILABILITY.BLOCKED"
            @click="cancellationOpen = true"
          >
            {{ $t("booking.cancellation.action") }}
          </UButton>
        </span>
      </UTooltip>
    </div>
    <!--
      Outside the block above on purpose: a cancellation turns the booking
      non-live and the block goes, while the dialog is still showing its
      result. Closed, the dialog renders nothing.
    -->
    <BookingCancellationDialog
      v-model:open="cancellationOpen"
      :booking="booking"
    />
  </div>
</template>

<script setup>
import BookingCancellationDialog from "~/components/user/bookings/BookingCancellationDialog.vue";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import {
  CANCELLATION_AVAILABILITY,
  cancellationAvailabilityOf,
  cancellationContactHintOf,
  openCancellationRequestOf,
} from "~/utils/bookingCancellation.js";

/**
 * The entry to the cancellation on the booking details: the button, the
 * note about an open request by email, and the dialog they open. Renders
 * nothing visible while there is nothing to cancel.
 */

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
const { formatDate } = useFormatting();

const cancellationOpen = ref(false);
const cancellation = computed(() => cancellationAvailabilityOf(props.booking));
const cancellationBlockedHint = computed(
  () =>
    cancellationContactHintOf(props.booking) ||
    t("booking.cancellation.blockedDefault"),
);
const openCancellationRequest = computed(() =>
  openCancellationRequestOf(props.booking),
);
const openRequestNote = computed(() => {
  const request = openCancellationRequest.value;
  return t("booking.cancellation.openRequestSince", {
    date: request?.timeCreated ? formatDate(request.timeCreated) : "–",
  });
});
</script>

<style scoped></style>

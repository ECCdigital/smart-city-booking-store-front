<template>
  <!--
    The withdrawal of a private customer, beside the cancellation: a mail to
    the tenant with a prepared text, opened in the customer's mail program.
    Shown only where the backend offers it (`withdrawalUrlOf`).
  -->
  <div v-if="withdrawalUrl" class="mb-5">
    <UTooltip :text="$t('booking.withdrawal.hint')">
      <span class="inline-block">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-mail"
          :href="withdrawalUrl"
          external
        >
          {{ $t("booking.withdrawal.action") }}
        </UButton>
      </span>
    </UTooltip>
  </div>
</template>

<script setup>
import { withdrawalUrlOf } from "~/utils/bookingWithdrawal.js";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const withdrawalUrl = computed(() => withdrawalUrlOf(props.booking));
</script>

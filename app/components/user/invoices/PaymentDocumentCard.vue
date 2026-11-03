<template>
  <!-- One invoice or receipt as a card, for screens too narrow for the
       table of Konto › Rechnungen. -->
  <article
    class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 my-2 border border-gray-200 dark:border-gray-700"
  >
    <div class="flex items-center justify-between gap-2 mb-2">
      <span
        class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
      >
        {{ paymentDocument.typeLabel }}
      </span>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ formatDate(paymentDocument.timeCreated) }}
      </span>
    </div>

    <button
      type="button"
      class="block w-full text-left font-semibold text-primary hover:underline break-words cursor-pointer"
      :aria-label="t('account.invoices.actions.open', { title: paymentDocument.title })"
      @click="emit('open')"
    >
      {{ paymentDocument.title }}
    </button>

    <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt class="text-gray-500 dark:text-gray-400">
        {{ t("account.invoices.columns.bookables") }}
      </dt>
      <dd class="min-w-0 break-words line-clamp-3">
        {{ paymentDocument.bookableLabel }}
      </dd>
      <dt class="text-gray-500 dark:text-gray-400">
        {{ t("account.invoices.columns.bookingId") }}
      </dt>
      <dd class="min-w-0">
        <NuxtLink :to="bookingTo" class="text-primary hover:underline">
          #{{ paymentDocument.bookingId }}
        </NuxtLink>
      </dd>
    </dl>

    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <BookingPayedChip :booking="paymentDocument.booking" />
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-download"
          color="neutral"
          variant="soft"
          size="sm"
          :label="t('account.invoices.actions.downloadLabel')"
          :aria-label="
            t('account.invoices.actions.download', { title: paymentDocument.title })
          "
          @click="emit('download')"
        />
        <UButton
          icon="i-lucide-printer"
          color="neutral"
          variant="soft"
          size="sm"
          :label="t('account.invoices.actions.printLabel')"
          :aria-label="
            t('account.invoices.actions.print', { title: paymentDocument.title })
          "
          @click="emit('print')"
        />
      </div>
    </div>
  </article>
</template>
<script setup>
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  // A row of the invoices table.
  paymentDocument: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["open", "download", "print"]);

const { t } = useI18n();
const { formatDate } = useFormatting();
const { tenantTo } = useTenantRoute();

const bookingTo = computed(() =>
  tenantTo(`/account/bookings/${props.paymentDocument.bookingId}`),
);
</script>

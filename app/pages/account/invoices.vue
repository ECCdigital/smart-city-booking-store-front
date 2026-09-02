<template>
  <div class="w-full">
    <PageHeader
      :title="t('account.invoices.title')"
      description="Hier finden Sie Ihre Rechnungen und Zahlungsbelege."
    />

    <div
      v-if="!pending && paymentDocuments.length === 0"
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div class="text-4xl mb-4">🧾</div>
      <h2 class="text-xl font-semibold mb-2">
        {{ t("account.invoices.emptyTitle") }}
      </h2>
      <p class="text-gray-500 max-w-md">
        {{ t("account.invoices.emptyDescription") }}
      </p>
    </div>

    <div v-else class="w-full">
      <UTable
        v-model:sorting="sorting"
        v-model:pagination="pagination"
        :data="paymentDocuments"
        :columns="columns"
        :loading="pending"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        :ui="{
          base: 'min-w-full table-fixed',
          th: 'overflow-hidden',
          td: 'overflow-hidden',
        }"
        class="w-full"
      >
        <template
          v-for="col in sortableColumns"
          :key="col.id"
          #[`${col.id}-header`]="{ column }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            :label="col.label"
            :icon="sortIcon(column)"
            class="-mx-2.5"
            @click="column.toggleSorting(column.getIsSorted() === 'asc')"
          />
        </template>

        <template #timeCreated-cell="{ row }">
          {{ formatDate(row.original.timeCreated) }}
        </template>
        <template #title-cell="{ row }">
          <UTooltip
            :disabled="!row.original.title"
            :ui="wrapTooltipUi"
          >
            <span class="block w-full truncate">
              {{ row.original.title }}
            </span>
            <template #content>
              <span class="min-w-0 w-full whitespace-normal break-words">
                {{ row.original.title }}
              </span>
            </template>
          </UTooltip>
        </template>
        <template #bookingId-cell="{ row }">
          <NuxtLink
            :to="tenantTo(`/account/bookings/${row.original.bookingId}`)"
            class="block truncate text-primary hover:underline"
          >
            #{{ row.original.bookingId }}
          </NuxtLink>
        </template>
        <template #bookableNames-cell="{ row }">
          <UTooltip
            :disabled="!row.original.bookableNames"
            :ui="wrapTooltipUi"
          >
            <span class="block w-full truncate">
              {{ row.original.bookableNames }}
            </span>
            <template #content>
              <span class="min-w-0 w-full whitespace-normal break-words">
                {{ row.original.bookableNames }}
              </span>
            </template>
          </UTooltip>
        </template>
        <template #paidLabel-cell="{ row }">
          <BookingPayedChip :booking="row.original.booking" />
        </template>
      </UTable>

      <div
        v-if="paymentDocuments.length > pagination.pageSize"
        class="flex justify-center mt-4 mb-10"
      >
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pagination.pageSize"
          :total="paymentDocuments.length"
          :sibling-count="1"
          show-edges
        >
          <template #first>
            <span class="hidden" />
          </template>
          <template #last>
            <span class="hidden" />
          </template>
        </UPagination>
      </div>
    </div>
  </div>
</template>
<script setup>
import { getPaginationRowModel } from "@tanstack/vue-table";
import { useBookingStore } from "~~/stores/bookings.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import { resolveBookingPaymentChip } from "~/utils/bookingPaymentStatus.js";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountInvoices"));

const bookingStore = useBookingStore();
const { formatDate } = useFormatting();
const { tenantTo } = useTenantRoute();

const { pending } = await useAsyncData("account-invoices", () =>
  bookingStore.fetchBookings(),
);

const PAGE_SIZE = 25;
const wrapTooltipUi = {
  content: "h-auto max-w-xs items-start py-1.5",
};

const sorting = ref([{ id: "timeCreated", desc: true }]);
const pagination = ref({
  pageIndex: 0,
  pageSize: PAGE_SIZE,
});

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (page) => {
    pagination.value = {
      ...pagination.value,
      pageIndex: page - 1,
    };
  },
});

const sortableColumns = computed(() => [
  {
    id: "timeCreated",
    label: t("account.invoices.columns.createdAt"),
    width: "16%",
  },
  {
    id: "title",
    label: t("account.invoices.columns.title"),
    width: "20%",
  },
  {
    id: "typeLabel",
    label: t("account.invoices.columns.type"),
    width: "14%",
  },
  {
    id: "bookingId",
    label: t("account.invoices.columns.bookingId"),
    width: "16%",
  },
  {
    id: "bookableNames",
    label: t("account.invoices.columns.bookables"),
    width: "20%",
  },
  {
    id: "paidLabel",
    label: t("account.invoices.columns.paid"),
    width: "14%",
  },
]);

const columns = computed(() =>
  sortableColumns.value.map((column) => ({
    accessorKey: column.id,
    meta: {
      class: {
        th: "max-w-0",
        td: "max-w-0",
      },
      style: {
        th: { width: column.width },
        td: { width: column.width },
      },
    },
  })),
);

const paymentDocuments = computed(() => {
  return bookingStore.getBookings.flatMap((booking) => {
    const bookableNames = (booking.bookableItems || [])
      .map((item) => item._bookableUsed?.title)
      .filter(Boolean)
      .join(", ");

    return (booking.attachments || [])
      .filter(
        (attachment) =>
          attachment.type === "invoice" || attachment.type === "receipt",
      )
      .map((attachment) => ({
        timeCreated: Number(attachment.timeCreated) || 0,
        title: attachment.title || attachment.name || "",
        type: attachment.type,
        typeLabel: documentTypeLabel(attachment.type),
        bookingId: booking.id,
        bookableNames: bookableNames || t("account.invoices.unknownBookable"),
        paidLabel: resolveBookingPaymentChip(booking, t).label,
        booking,
      }));
  });
});

function documentTypeLabel(type) {
  if (type === "invoice") {
    return t("account.invoices.types.invoice");
  }
  if (type === "receipt") {
    return t("account.invoices.types.receipt");
  }
  return t("account.invoices.types.unknown");
}

function sortIcon(column) {
  const isSorted = column.getIsSorted();
  if (isSorted === "asc") {
    return "i-lucide-arrow-up-narrow-wide";
  }
  if (isSorted === "desc") {
    return "i-lucide-arrow-down-wide-narrow";
  }
  return "i-lucide-arrow-up-down";
}
</script>

<style scoped></style>

<template>
  <div class="w-full">
    <PageHeader
      :title="t('account.invoices.title')"
      :description="$t('account.invoicesDescription')"
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
      <!-- The search reads the bookables a document belongs to, so a typed
           name finds every invoice and receipt of that room or device. -->
      <div class="flex justify-end mb-4">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          size="md"
          variant="outline"
          :placeholder="$t('account.invoices.searchPlaceholder')"
          :aria-label="$t('account.invoices.searchPlaceholder')"
          class="w-full md:w-[40%]"
          :ui="{ trailing: 'pe-0' }"
        >
          <template #trailing>
            <ClearButton
              :show-clear-button="!!searchQuery"
              @clear="searchQuery = ''"
            />
          </template>
        </UInput>
      </div>

      <!-- The table gives no hold on its rows, so it fades out and in as a
           whole in the shared list transition when the search changes what
           it shows. UTable renders more than one root node, which a
           Transition cannot fade, so a plain div carries the key. -->
      <Transition name="card-list" mode="out-in">
        <div
          v-if="!pending && shownDocuments.length === 0"
          key="no-matches"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon
            name="i-lucide-filter-x"
            class="text-6xl text-gray-400 mb-4"
          />
          <p class="text-gray-500">{{ t("account.invoices.noMatches") }}</p>
        </div>

        <div v-else :key="shownKey">
          <UTable
            v-model:sorting="sorting"
            v-model:pagination="pagination"
            :data="shownDocuments"
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
                <button
                  type="button"
                  class="block w-full truncate text-left text-primary hover:underline cursor-pointer"
                  :aria-label="
                    t('account.invoices.actions.open', {
                      title: row.original.title,
                    })
                  "
                  @click="openDocument(row.original.attachment, row.original)"
                >
                  {{ row.original.title }}
                </button>
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
                :disabled="!row.original.bookableLabel"
                :ui="wrapTooltipUi"
              >
                <span class="block w-full truncate">
                  {{ row.original.bookableLabel }}
                </span>
                <template #content>
                  <span class="min-w-0 w-full whitespace-normal break-words">
                    {{ row.original.bookableLabel }}
                  </span>
                </template>
              </UTooltip>
            </template>
            <template #paidLabel-cell="{ row }">
              <BookingPayedChip :booking="row.original.booking" />
            </template>
            <template #actions-header>
              <span class="sr-only">
                {{ t("account.invoices.columns.actions") }}
              </span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1">
                <UTooltip :text="t('account.invoices.actions.downloadTooltip')">
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="ghost"
                    :aria-label="
                      t('account.invoices.actions.download', {
                        title: row.original.title,
                      })
                    "
                    @click="
                      downloadDocument(row.original.attachment, row.original)
                    "
                  />
                </UTooltip>
                <UTooltip :text="t('account.invoices.actions.printTooltip')">
                  <UButton
                    icon="i-lucide-printer"
                    color="neutral"
                    variant="ghost"
                    :aria-label="
                      t('account.invoices.actions.print', {
                        title: row.original.title,
                      })
                    "
                    @click="
                      printDocument(row.original.attachment, row.original)
                    "
                  />
                </UTooltip>
              </div>
            </template>
          </UTable>
        </div>
      </Transition>

      <div
        v-if="shownDocuments.length > pagination.pageSize"
        class="flex justify-center mt-4 mb-10"
      >
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pagination.pageSize"
          :total="shownDocuments.length"
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
import ClearButton from "~/components/inputs/ClearButton.vue";
import { getPaginationRowModel } from "@tanstack/vue-table";
import { useBookingStore } from "~~/stores/bookings.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import { resolveBookingPaymentChip } from "~/utils/bookingPaymentStatus.js";
import {
  paymentDocumentsOf,
  searchPaymentDocuments,
} from "~/utils/paymentDocumentList.js";
import { usePaymentDocument } from "~/composables/usePaymentDocument.js";

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
const { openDocument, downloadDocument, printDocument } = usePaymentDocument();

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
    width: "14%",
  },
  {
    id: "title",
    label: t("account.invoices.columns.title"),
    width: "20%",
  },
  {
    id: "typeLabel",
    label: t("account.invoices.columns.type"),
    width: "12%",
  },
  {
    id: "bookingId",
    label: t("account.invoices.columns.bookingId"),
    width: "14%",
  },
  {
    id: "bookableNames",
    label: t("account.invoices.columns.bookables"),
    width: "18%",
  },
  {
    id: "paidLabel",
    label: t("account.invoices.columns.paid"),
    width: "12%",
  },
]);

const ACTIONS_WIDTH = "10%";

const columns = computed(() => [
  ...sortableColumns.value.map((column) => ({
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
  {
    id: "actions",
    meta: {
      style: {
        th: { width: ACTIONS_WIDTH },
        td: { width: ACTIONS_WIDTH },
      },
    },
  },
]);

const paymentDocuments = computed(() =>
  paymentDocumentsOf(bookingStore.getBookings).map((document) => ({
    ...document,
    typeLabel: documentTypeLabel(document.type),
    bookableLabel:
      document.bookableNames || t("account.invoices.unknownBookable"),
    paidLabel: resolveBookingPaymentChip(document.booking, t).label,
  })),
);

const searchQuery = ref("");

const shownDocuments = computed(() =>
  searchPaymentDocuments(paymentDocuments.value, searchQuery.value),
);

// Changes when the table shows other documents: after a search, or when the
// bookings come in or change.
const shownKey = computed(() =>
  shownDocuments.value.map((document) => document.key).join("|"),
);

// A new search gives a different list: the reader expects its first page.
watch(searchQuery, () => {
  pagination.value = { ...pagination.value, pageIndex: 0 };
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

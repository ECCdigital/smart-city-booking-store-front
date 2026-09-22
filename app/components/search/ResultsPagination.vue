<template>
  <div
    v-if="total > 0"
    class="mt-4 mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
  >
    <div class="flex items-center gap-2">
      <label :for="selectId" class="text-sm whitespace-nowrap">
        {{ $t("results.pagination.itemsPerPage") }}
      </label>
      <USelect
        :id="selectId"
        v-model="pageSize"
        :items="pageSizeOptions"
        size="sm"
        class="w-28"
      />
    </div>

    <UPagination
      v-if="pageCount > 1"
      v-model:page="page"
      :items-per-page="itemsPerPage"
      :total="total"
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

    <p class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
      {{
        $t("results.pagination.range", {
          from: firstItemOnPage,
          to: lastItemOnPage,
          total,
        })
      }}
    </p>
  </div>
</template>
<script setup>
import {
  ALL_ITEMS,
  PAGE_SIZE_OPTIONS,
} from "~/composables/search/useResultPagination.js";

const page = defineModel("page", { type: Number, required: true });
const pageSize = defineModel("pageSize", { type: Number, required: true });

defineProps({
  total: {
    type: Number,
    required: true,
  },
  itemsPerPage: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  firstItemOnPage: {
    type: Number,
    required: true,
  },
  lastItemOnPage: {
    type: Number,
    required: true,
  },
});

const { t } = useI18n();

// Unique per instance: the list and the grid render at the same time, only one
// of them visible, so a shared id would tie both labels to the same select.
const selectId = `results-per-page-${useId()}`;

const pageSizeOptions = computed(() =>
  PAGE_SIZE_OPTIONS.map((size) => ({
    label: size === ALL_ITEMS ? t("results.pagination.all") : String(size),
    value: size,
  })),
);
</script>

<style scoped></style>

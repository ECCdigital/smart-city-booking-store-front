<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  validationErrors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:modelValue"]);

const selected = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

onMounted(() => {
  const mandatoryIds = props.items
    .filter((entry) => entry.mandatory)
    .map((entry) => entry.item.id);

  const missing = mandatoryIds.filter((id) => !selected.value.includes(id));
  if (missing.length > 0) {
    selected.value = [...selected.value, ...missing];
  }
});

function toggleSelection(itemId) {
  if (selected.value.includes(itemId)) {
    selected.value = selected.value.filter((id) => id !== itemId);
  } else {
    selected.value = [...selected.value, itemId];
  }
}

function isSelected(itemId) {
  return selected.value.includes(itemId);
}

function isMandatory(entry) {
  return entry.mandatory === true;
}

function getMinPrice(bookable) {
  const categories = bookable?.priceCategories || [];
  if (categories.length === 0) return null;

  const prices = categories
    .map((c) => c.priceEur)
    .filter((p) => p !== null && p !== undefined);

  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function formatPriceLabel(value) {
  if (value === null || value === undefined || value === 0)
    return $t("common.freeOfCharge");
  return "+ " + value.toFixed(2).replace(".", ",") + " €";
}

function getBookableIcon(bookable) {
  if (bookable.type === "room") return "i-lucide-door-open";
  if (bookable.type === "ticket") return "i-lucide-ticket";
  if (bookable.type === "event-location") return "i-lucide-map-pin";
  return "i-lucide-box";
}

function getErrorForItem(itemId) {
  return props.validationErrors[itemId];
}
</script>

<template>
  <div v-if="items.length > 0">
    <div class="flex items-center gap-2 mb-4">
      <UIcon name="i-lucide-plus" class="text-primary" size="18" />
      <h3 class="text-sm font-bold tracking-wide text-gray-500 dark:text-gray-400">
        {{ $t("checkout.additionalObjects") }}
        <span class="font-normal">({{ $t('common.optional') }})</span>
      </h3>
    </div>

    <div class="space-y-3">
      <div v-for="entry in items" :key="entry.item.id">
        <button
          type="button"
          :disabled="isMandatory(entry)"
          class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 text-left cursor-pointer disabled:cursor-default overflow-hidden"
          :class="[
            getErrorForItem(entry.item.id)
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
              : isSelected(entry.item.id)
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
          ]"
          @click="!isMandatory(entry) && toggleSelection(entry.item.id)"
        >
        <div class="shrink-0">
          <div
            class="w-5 h-5 rounded flex items-center justify-center border-2 transition-colors"
            :class="
              isSelected(entry.item.id)
                ? 'bg-primary border-primary'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            "
          >
            <UIcon
              v-if="isSelected(entry.item.id)"
              name="i-lucide-check"
              size="14"
              class="text-white"
            />
          </div>
        </div>

        <div
          class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          :class="
            isSelected(entry.item.id)
              ? 'bg-primary/10 dark:bg-primary/20'
              : 'bg-gray-100 dark:bg-gray-800'
          "
        >
          <img
            v-if="entry.item.imgUrl"
            :src="entry.item.imgUrl"
            :alt="entry.item.title"
            class="w-6 h-6 object-cover rounded"
          />
          <UIcon
            v-else
            :name="getBookableIcon(entry.item)"
            size="20"
            :class="
              isSelected(entry.item.id)
                ? 'text-primary'
                : 'text-gray-400 dark:text-gray-500'
            "
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-900 dark:text-white truncate">
              {{ entry.item.title }}
            </span>
            <span
              v-if="isMandatory(entry)"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary flex-shrink-0"
            >
              {{ $t("common.obligation") }}
            </span>
          </div>
          <!-- Inline Error -->
          <div
            v-if="getErrorForItem(entry.item.id)"
            class="flex items-start gap-1.5 mt-1"
          >
            <UIcon
              name="i-lucide-alert-circle"
              class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              size="14"
            />
            <span class="text-sm text-red-700 dark:text-red-300 break-words">
              {{ $t(getErrorForItem(entry.item.id).reason || 'checkout.bookable_unavailable') }}
            </span>
          </div>
        </div>

        <!-- Price -->
        <div class="flex-shrink-0 text-right">
          <span
            class="text-base font-semibold"
            :class="
              getErrorForItem(entry.item.id)
                ? 'text-red-400 dark:text-red-500 line-through'
                : getMinPrice(entry.item) > 0
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-gray-500'
            "
          >
            {{ formatPriceLabel(getMinPrice(entry.item)) }}
          </span>
        </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

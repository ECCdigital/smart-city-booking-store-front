<template>
  <div class="py-2 space-y-1">
    <div
      v-for="item in relatedBookables"
      :key="item.id"
      class="flex justify-between items-center bg-white dark:bg-gray-700 rounded-lg shadow-sm px-4 py-2 border border-gray-200 dark:border-gray-500 min-w-[250px]"
    >
      <div class="space-y-0.5">
        <BookableTypeBadge
          :type="item.type"
          :ui="{
            base: 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          }"
        />
        <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {{ item.title }}
        </div>
      </div>
      <UButton
        class="text-sm bg-primary text-white px-2 md:px-3 py-1"
        label="Ansehen"
        @click="goToDetails(item.id, item.type)"
      />
    </div>
  </div>
</template>
<script setup>
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";
import { useRedirection } from "~/composables/utils/useRedirection.js";

const props = defineProps({
  relatedBookables: {
    type: Array,
    default: () => [],
  },
});

const { goToDetails } = useRedirection();
</script>

<style scoped></style>

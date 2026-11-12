<template>
  <!-- A section of the booking details, open from the start, that closes
       and opens again by its heading, the number of its entries beside it. -->
  <UCollapsible v-model:open="open" class="mb-5" :unmount-on-hide="false">
    <button
      type="button"
      class="group w-full flex items-center justify-between gap-2 py-1 text-left font-medium rounded focus-visible:outline-2 focus-visible:outline-primary"
    >
      <span>
        {{ title }}
        <span
          v-if="count !== null"
          class="ml-1 text-sm font-normal text-gray-500"
        >
          ({{ count }})
        </span>
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="w-5 h-5 shrink-0 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
      />
    </button>
    <template #content>
      <div class="pt-1">
        <slot />
      </div>
    </template>
  </UCollapsible>
</template>
<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  /** The number of entries, shown beside the heading. */
  count: {
    type: Number,
    default: null,
  },
});

// Open from the start; closed only when the customer wants it out of the way.
const open = ref(true);
</script>

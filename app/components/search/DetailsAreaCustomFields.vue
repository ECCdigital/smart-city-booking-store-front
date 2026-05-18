<template>
  <div class="inline-flex flex-wrap space-x-1">
    <div
      v-for="(field, i) in usedCatalogFilterFields"
      :key="i"
      class="flex items-center"
    >
      <!--
      <div class="text-sm text-red-300">{{ field }}</div>
      -->
      <UBadge
        v-if="field.inputType === 'boolean'"
        :trailing-icon="field.value ? 'i-lucide-check' : 'i-lucide-x'"
        size="md"
        color="neutral"
        variant="solid"
        class="bg-gray-300 rounded-full text-sm mr-2 mb-2 text-black"
      >
        {{ field.caption }}
      </UBadge>
      <UBadge
        v-else-if="field.inputType === 'select'"
        size="md"
        color="neutral"
        variant="solid"
        class="bg-gray-300 rounded-full text-sm mr-2 mb-2 text-black"
      >
        {{ field.caption }}:
        <span class="italic">{{
          getSelectOption(field.options, field.value)
        }}</span>
      </UBadge>

      <UBadge
        v-else
        size="md"
        color="neutral"
        variant="solid"
        class="bg-gray-300 rounded-full text-sm mr-2 mb-2 text-black"
      >
        {{ field.caption }}: <span class="italic">{{ field.value }}</span>
      </UBadge>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  customFields: {
    type: Array,
    required: true,
  },
});

const usedCatalogFilterFields = computed(() => {
  return props.customFields
    .filter(
      (field) =>
        field.usageOptions?.context === "catalog" && field.value !== null,
    )
    .sort((a, b) => a.inputType.localeCompare(b.inputType));
});

function getSelectOption(options, value) {
  return options.find((option) => option.value === value).caption;
}
</script>

<style scoped></style>

<script setup>
defineProps({
  /**
   * Array of custom field definitions (already filtered to checkout context).
   * Shape (per item):
   *   {
   *     id, caption, placeholder, inputType, options: [{ caption, value }],
   *     usageOptions: { context, requiredInCheckout, ... }
   *   }
   */
  fields: {
    type: Array,
    default: () => [],
  },
});

const values = defineModel("values", {
  type: Object,
  default: () => ({}),
});

function selectItemsForField(field) {
  return (field?.options || []).map((opt) => ({
    label: opt.caption,
    value: opt.value,
  }));
}

function isRequired(field) {
  return field?.usageOptions?.requiredInCheckout === true;
}

function updateField(id, value) {
  values.value = {
    ...values.value,
    [id]: value,
  };
}

function getValue(id) {
  return values.value?.[id];
}

function getBoolValue(id) {
  return !!values.value?.[id];
}
</script>

<template>
  <UCard
    v-if="fields.length > 0"
    variant="soft"
    class="rounded-lg"
  >
    <template #header>
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ $t("checkout.data.customFieldsSectionTitle") }}
      </h3>
    </template>

    <div class="space-y-3">
      <template v-for="field in fields" :key="field.id">
        <div v-if="field.inputType === 'boolean'" class="flex items-start gap-2">
          <UCheckbox
            :model-value="getBoolValue(field.id)"
            class="mt-0.5"
            @update:model-value="updateField(field.id, $event)"
          />
          <label
            class="text-sm text-gray-900 dark:text-white cursor-pointer"
            @click="updateField(field.id, !getBoolValue(field.id))"
          >
            {{ field.caption }}
            <span
              v-if="isRequired(field)"
              class="text-red-500 ml-0.5"
            >*</span>
          </label>
        </div>

        <UFormField
          v-else
          :label="field.caption"
          :required="isRequired(field)"
        >
          <USelect
            v-if="field.inputType === 'select'"
            :model-value="getValue(field.id) ?? undefined"
            :items="selectItemsForField(field)"
            :placeholder="field.placeholder || $t('checkout.data.customFieldSelectPlaceholder')"
            class="w-full"
            @update:model-value="updateField(field.id, $event)"
          />

          <UTextarea
            v-else-if="field.inputType === 'text'"
            :model-value="getValue(field.id) ?? ''"
            :rows="3"
            autoresize
            :placeholder="field.placeholder || ''"
            class="w-full"
            @update:model-value="updateField(field.id, $event)"
          />

          <UInput
            v-else-if="field.inputType === 'numeric'"
            :model-value="getValue(field.id) ?? ''"
            type="number"
            :placeholder="field.placeholder || ''"
            class="w-full"
            @update:model-value="updateField(field.id, $event === '' || $event === null ? null : Number($event))"
          />

          <UInput
            v-else
            :model-value="getValue(field.id) ?? ''"
            type="text"
            :placeholder="field.placeholder || ''"
            class="w-full"
            @update:model-value="updateField(field.id, $event)"
          />
        </UFormField>
      </template>
    </div>
  </UCard>
</template>

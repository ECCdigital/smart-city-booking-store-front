<template>
  <dl v-if="belowDescriptionFields.length" class="mt-4 space-y-2">
    <div
      v-for="field in belowDescriptionFields"
      :key="field.id"
      class="flex gap-2"
    >
      <dt class="font-semibold md:shrink-0">{{ field.caption }}:</dt>
      <dd>
        <template v-if="field.inputType === 'boolean'">
          {{ $t("bookableDetail.yes") }}
        </template>
        <template v-else>{{ customFieldValueText(field) }}</template>
      </dd>
    </div>
  </dl>
</template>
<script setup>
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { belowDescriptionFields, customFieldValueText } =
  useBookableDetailContent(() => props.item, props.isEvent);
</script>
<style scoped></style>

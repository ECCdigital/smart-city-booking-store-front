<template>
  <div
    v-if="moreInfoFields.length"
    class="bg-gray-200 dark:bg-gray-700 rounded-md p-3"
  >
    <h3 class="font-bold mb-2">
      {{ $t("bookableDetail.moreInfo") }}
    </h3>
    <dl class="space-y-2">
      <div
        v-for="field in moreInfoFields"
        :key="field.id"
        class="flex justify-between gap-2"
      >
        <dt>{{ field.caption }}</dt>
        <dd class="text-right">
          <template v-if="field.inputType === 'boolean'">
            {{ $t("bookableDetail.yes") }}
          </template>
          <template v-else>{{ customFieldValueText(field) }}</template>
        </dd>
      </div>
    </dl>
  </div>
</template>
<script setup>
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});
const { moreInfoFields, customFieldValueText } = useBookableDetailContent(
  () => props.item,
  props.isEvent,
);
</script>

<style scoped></style>

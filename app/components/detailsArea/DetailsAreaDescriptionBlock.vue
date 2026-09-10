<template>
  <div>
    <div class="line-clamp-3 md:line-clamp-none" v-html="htmlDescription" />

    <div v-if="isEvent" class="flex gap-2 mt-4">
      <p class="font-semibold">Veranstalter:</p>
      <p>
        {{ item.eventOrganizer.name }}
      </p>
    </div>
    <div class="flex justify-end md:hidden">
      <UButton
        :label="$t('bookableDetail.viewAll')"
        variant="ghost"
        class="mt-2"
        @click="showFullDescription = true"
      />
    </div>

    <BookableCustomFieldsDescription v-if="!isEvent" :item="item" />

    <UModal
      v-model:open="showFullDescription"
      :title="$t('bookableDetail.descriptionTitle', { title: item?.title })"
      size="lg"
      class="max-h-[80vh]"
      :ui="{ overlay: 'backdrop-blur-md' }"
    >
      <template #body>
        <div class="p-4" v-html="htmlDescription" />
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";
import BookableCustomFieldsDescription from "~/components/bookables/BookableCustomFieldsDescription.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    required: false,
  },
});

const { htmlDescription } = useBookableDetailContent(
  () => props.item,
  props.isEvent,
);

const showFullDescription = ref(false);
</script>

<style scoped></style>

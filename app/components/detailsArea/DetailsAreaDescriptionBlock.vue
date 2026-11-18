<template>
  <div>
    <div class="line-clamp-3 md:line-clamp-none" v-html="htmlDescription" />
    <div class="flex justify-end md:hidden">
      <UButton
        :label="$t('bookableDetail.viewAll')"
        variant="ghost"
        class="mt-2"
        @click="showFullDescription = true"
      />
    </div>

    <div v-if="isEvent" class="mt-4">
      <div class="flex gap-2">
        <p class="font-semibold">{{ $t("bookableDetail.organiser") }}</p>
        <p>
          {{ item.eventOrganizer.name }}
        </p>
      </div>
      <DetailsAreaEventContactPerson :item="item" class="mt-2" />
    </div>

    <BookableCustomFieldsDescription v-if="!isEvent" :item="item" />

    <UModal
      v-model:open="showFullDescription"
      :title="$t('bookableDetail.descriptionTitle', { title })"
      size="lg"
      class="max-h-[80vh]"
      :ui="{
        overlay: 'backdrop-blur-md',
        // The close button sits absolutely at the end of the header; a long
        // title keeps clear of it instead of running underneath.
        title: 'pe-8 break-words',
      }"
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
import DetailsAreaEventContactPerson from "~/components/detailsArea/DetailsAreaEventContactPerson.vue";


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

const { htmlDescription, title } = useBookableDetailContent(
  () => props.item,
  props.isEvent,
);

const showFullDescription = ref(false);
</script>

<style scoped></style>

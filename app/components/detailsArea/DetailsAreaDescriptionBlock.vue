<template>
  <div>
    <div class="line-clamp-3 md:line-clamp-none" v-html="htmlDescription" />
    <div v-if="hasDescription" class="flex justify-end md:hidden">
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
      size="lg"
      class="max-h-[80vh]"
      :ui="{
        overlay: 'backdrop-blur-md',
        // The content is a height-capped flex column; without shrink-0 a long
        // description squeezes the header and the title runs into the body.
        header: 'shrink-0',
        // The close button sits absolutely at the end of the header; a long
        // title keeps clear of it instead of running underneath.
        title: 'pe-8 break-words',
      }"
    >
      <template #title>
        <!-- Clamped only visually: the dialog's accessible name stays the full title. -->
        <span
          ref="titleText"
          class="line-clamp-3"
          :class="{ 'title-fade': isTitleClamped }"
        >
          {{ $t("bookableDetail.descriptionTitle", { title }) }}
        </span>
      </template>
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

// An editor leaves markup such as `<p></p>` behind for an empty description,
// so the text without tags decides, not the HTML string.
const hasDescription = computed(
  () =>
    !!htmlDescription.value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim(),
);

const showFullDescription = ref(false);

// The fade marks a cut-off title, so it only shows when the clamp hides text.
const titleText = useTemplateRef("titleText");
const isTitleClamped = ref(false);
useResizeObserver(titleText, () => {
  const el = titleText.value;
  isTitleClamped.value = !!el && el.scrollHeight > el.clientHeight + 1;
});
</script>

<style scoped>
/* Lines above the last stay solid; the last visible line fades out towards its end. */
.title-fade {
  mask-image:
    linear-gradient(#000, #000), linear-gradient(to right, #000 40%, transparent);
  mask-size:
    100% calc(100% - 1lh),
    100% 1lh;
  mask-position: top, bottom;
  mask-repeat: no-repeat;
}
</style>

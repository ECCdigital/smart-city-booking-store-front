
<template>
  <div class="max-w-[1600px] px-2 md:px-[15px] pb-[50px]">
  <!-- toDo - weitere Bilder einfügen *** -->
  <DetailsAreaImages :item="item" :is-event="props.isEvent" />


  <div class="w-full flex justify-between my-5">
    <UButton
        label="Zurück"
        icon="i-lucide-arrow-left"
        class="justify-center px-5 bg-gray-300 text-black"
        :style="{ cursor:'pointer' }"
        @click="$router.back()"
    />
    <UButton
        label="Teilen"
        icon="i-lucide-share-2"
        class="justify-center px-5"
        :style="{color: contrastToPrimary, cursor: 'pointer'}"
        @click="share()"
    />

  </div>

  <DetailsAreaBookableContent v-if="!isEvent" :item="props.item"/>
  <DetailsAreaEventContent v-else :item="props.item" />

</div>

</template>
<script setup>
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import DetailsAreaBookableContent from "~/components/search/DetailsAreaBookableContent.vue";
import DetailsAreaImages from "~/components/search/DetailsAreaImages.vue";
import DetailsAreaEventContent from "~/components/search/DetailsAreaEventContent.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
})

const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary()
);

const notification = useNotification();
async function share() {
  await navigator.clipboard.writeText(window.location.href);
  notification.success(
      "Der Link zur aktuellen Suche wurde in Ihre Zwischenablage kopiert.",
      "Link erfolgreich kopiert!"
  );
}
</script>
<style scoped>

</style>
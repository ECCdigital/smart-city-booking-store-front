
<template>
<div class="mx-10 mb-15">
  <!-- toDo - weitere Bilder einfügen *** -->
  <DetailsAreaImages :item="item" :is-event="props.isEvent" />

  <div class="w-full flex justify-between my-5">
    <UButton
        label="Zurück"
        icon="i-lucide-arrow-left"
        class="justify-center px-5 bg-gray-300 text-black"

        @click="$router.back()"
    />

    <UButton
        label="Teilen"
        icon="i-lucide-share-2"
        class="justify-center px-5"
        :style="{fontcolor: contrastToPrimary}"
        @click="share()"
    />
  </div>

  <div class="flex">
    <DetailsAreaBookableContent v-if="!isEvent" :item="props.item" class=" basis-2/3"/>
    <DetailsAreaEventContent v-else :item="props.item" class=" basis-2/3"/>
    <!-- toDo - add map view -->
    <USkeleton class="basis-1/3" style="max-height: 300px" />
  </div>

  <!-- toDo - usw... -->
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

function share(){
  console.log("*** versuche die Details zu teilen ***");
}
</script>
<style scoped>

</style>
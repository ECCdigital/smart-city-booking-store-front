
<template>
<div class="mx-10 mb-15">
  <!-- toDo - Bilder einfügen *** -->

  <div class="-mt-10" style="max-height: 350px; height: 300px; overflow: hidden;">
    <img
        v-if="!isEvent && item?.imgUrl"
        :src="`/api/img?url=${encodeURIComponent(item.imgUrl)}`"
        alt=""
        class="w-full h-full object-contain rounded-l-xl"
    >
    <img
        v-else-if="isEvent && item?.information?.teaserImage"
        :src="`/api/img?url=${encodeURIComponent(item.information.teaserImage)}`"
        alt=""
        class="w-full h-full object-contain rounded-l-xl"
    >
    <img
        v-else
        src="../../assets/bookable-default.jpg"
        alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
        class="h-full w-full object-contain rounded-l-xl"
    >
  </div>


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
    <DetailsAreaBookableContent :item="props.item" :is-event="props.isEvent" class=" basis-2/3"/>
    <!-- toDo - add map view -->
    <USkeleton class="basis-1/3" />
  </div>

  <!-- toDo - usw... -->
</div>
</template>
<script setup>
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import DetailsAreaBookableContent from "~/components/search/DetailsAreaBookableContent.vue";

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
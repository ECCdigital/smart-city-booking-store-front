
<template>
<div style="max-width: 1600px; margin: auto; padding: 0 15px 50px 15px;">
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

  <div class="md:flex">
    <DetailsAreaBookableContent v-if="!isEvent" :item="props.item" class=" basis-2/3"/>
    <DetailsAreaEventContent v-else :item="props.item" class=" basis-2/3"/>
    <!-- toDo - add map view -->
    <div class="basis-1/3 space-y-3">
      <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
        <EventsEventAdressInformation v-if="isEvent" :event="item" />
        <BookablesBookableAdressInformation v-else :bookable="item"/>
      </div>
      <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
        <p class="font-bold mt-2">Preisinformationen</p>
        <p v-if="item.priceValueAddedTax" class="text-gray-500 text-sm italic">
          (Alle Preise inklusive Mehrwertsteuer.)
        </p>

        <EventPriceInformation v-if="isEvent" :event="item" />
        <BookablePriceInformation v-else :item="item" />

      </div>
    </div>
  </div>

  <!-- toDo - usw... -->
</div>

</template>
<script setup>
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import DetailsAreaBookableContent from "~/components/search/DetailsAreaBookableContent.vue";
import DetailsAreaImages from "~/components/search/DetailsAreaImages.vue";
import DetailsAreaEventContent from "~/components/search/DetailsAreaEventContent.vue";
import BookablePriceInformation from "~/components/bookables/BookablePriceInformation.vue";
import EventPriceInformation from "~/components/events/EventPriceInformation.vue";

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
<template>
<div class="mr-20">
  <!-- Title -->
  <p class="text-sm font-bold text-primary">
    {{ tenantName }}
  </p>
  <h2 class="text-2xl font-bold">{{ item?.title }}</h2>

  <BookableFlagDisplay :flags="item?.flags" is-detail-mode class="my-5" />

  <div v-html="item.description" />
  <USeparator class="w-full my-10" :ui="{ border: 'border-gray-300' }" />

  <div>
    <h3 class="text-xl font-bold">Verfügbarkeit</h3>
    <UAlert
        v-if="!timePeriod || (!timePeriod.start && !timePeriod.end)"
        color="error"
        title="Wählen Sie Daten aus, um die Verfügbarkeit und Preise zu sehen."
        icon="i-lucide-info"
        variant="ghost"
        class="p-2 text-red-500"
    />
    <InputTimePeriod
        :time-period="timePeriod"
        class="border rounded-lg mt-2 mb-5"
        style="max-width: 500px; width: 400px"
        @select-date="setSearchTimePeriod"
        @remove-date="removeSearchTimePeriod"
    />
  </div>
  <BookablePriceCategoriesDisplay
      v-if="!timePeriod || (!timePeriod.start && !timePeriod.end)"
      :item="item"
      :is-not-bookable="isNotBookable"
      @checkout="goToCheckout"
  />
  <div v-else class="bg-gray-300 rounded-lg p-3 mb-2 flex content-center">
    <span class="font-bold mr-1 content-center ">{{ item?.title }}</span>
    <span class="content-center ">
       / {{timeSpan}}
    </span>
    <div class="flex-1" />
    <BookablePriceDisplay
        v-if="updatedItems[0]"
        :bookable="updatedItems[0]"
        :calculated-price="updatedItems[0]?.calculatedPrice"
        class="mx-2 font-bold content-center "
    />
    <UButton
        v-if="!isNotBookable"
        label="Buchen"
        class="justify-center px-5"
        :style="{ color: contrastToPrimary }"
        @click="goToCheckout()"
    />
  </div>




  <div class="bg-amber-100">
    {{item}}
  </div>
  <div class="bg-amber-200">
    {{updatedItems}}
  </div>
<div class="bg-amber-300">...
</div>

</div>
</template>
<script setup>
import {useTenantStore} from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import InputTimePeriod from "~/components/inputs/InputTimePeriod.vue";
import {useCatalogQueryState} from "~/composables/search/useCatalogQueryState.js";
import BookablePriceCategoriesDisplay from "~/components/bookables/BookablePriceCategoriesDisplay.vue";
import {useBookableSearch} from "~/composables/search/useBookableSearch.js";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import {useCheckoutRedirect} from "~/composables/utils/useCheckoutRedirect.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { state: query } = useCatalogQueryState();
const {
  updatedItems,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: false, sourceItems: [props.item] });

const timePeriod = ref({
  start: query.start,
  end: query.end,
});
const timeSpan = computed(() => {
  const diffMs = timePeriod.value.end - timePeriod.value.start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  return diffHours + " Std."
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.item.tenantId).name;
});
const isNotBookable = ref(false); // toDo - implement logic to determine bookability


function setSearchTimePeriod(tp) {
  timePeriod.value = tp;
  runSearch({
    term: '',
    location: '',
    timeStart: timePeriod.value.start,
    timeEnd: timePeriod.value.end,
    isEvent: false
  })
}
function removeSearchTimePeriod() {
  timePeriod.value = null;
  resetResults()
}

function goToCheckout(checkoutData) {
  if(checkoutData){
    useCheckoutRedirect().redirectToCheckout(checkoutData);
  } else {
    const route = useRoute();
    useCheckoutRedirect().redirectToCheckout({
      id: props.item.id,
      tenantId: props.item.tenantId,
      start: route.query.start,
      end: route.query.end,
    });
  }

}

</script>


<style scoped>

</style>
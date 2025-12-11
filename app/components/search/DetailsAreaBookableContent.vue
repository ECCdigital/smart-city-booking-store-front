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
  <BookablePriceCategoriesDisplay :item="item" :is-not-bookable="isNotBookable"/>



</div>
</template>
<script setup>
import {useTenantStore} from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import InputTimePeriod from "~/components/inputs/InputTimePeriod.vue";
import {useCatalogQueryState} from "~/composables/search/useCatalogQueryState.js";
import BookablePriceCategoriesDisplay from "~/components/bookables/BookablePriceCategoriesDisplay.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { state: query } = useCatalogQueryState();

const timePeriod = ref({
  start: query.start,
  end: query.end,
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.item.tenantId).name;
});
const isNotBookable = ref(false); // toDo - implement logic to determine bookability


function setSearchTimePeriod(tp) {
  timePeriod.value = tp;
}
function removeSearchTimePeriod() {
  timePeriod.value = null;
}


</script>


<style scoped>

</style>
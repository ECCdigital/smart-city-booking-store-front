<template>
  <div
    class="shadow-lg h-full bg-white dark:bg-gray-700 rounded-xl"
    :class="isNotBookable ? 'opacity-70 dark:opacity-50' : 'cursor-pointer'"
    @click="goToDetails"
  >
    <div id="header" class="flex flex-col h-36">
      <div class="flex h-9/10">
        <img
          v-if="!isEvent && item?.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(item?.imgUrl)}`"
          alt="Bild des Buchungsobjekts"
          class="w-full object-cover rounded-t-xl"
        />
        <img
          v-else-if="isEvent && item?.information?.teaserImage"
          :src="`/api/img?url=${encodeURIComponent(
            item.information.teaserImage
          )}`"
          alt=""
          class="w-full object-cover rounded-t-xl"
        />
        <ImagePlaceholder v-else class="w-full h-full rounded-t-xl" />
      </div>
      <USeparator color="primary" type="solid" size="xl" class="w-full" />
    </div>

    <ResultCardBookableContent
      v-if="!isEvent"
      :bookable="item"
      :calculated-price="calculatedPrice"
      :is-not-bookable="isNotBookable"
    />
    <ResultCardEventContent
      v-if="isEvent"
      v-model:open-ticket-options="openEventTicketOptions"
      :event="item"
      :is-not-bookable="isNotBookable"
    />
  </div>
</template>
<script setup>
//import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import ResultCardBookableContent from "~/components/search/ResultCardBookableContent.vue";
import ResultCardEventContent from "~/components/search/ResultCardEventContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  calculatedPrice: {
    type: Object,
    default: null,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
});
const isEvent = computed(() => {
  if ("type" in props.item) {
    return false;
  } else {
    return true;
  }
});

const { tenantTo } = useTenantRoute();
const openEventTicketOptions = ref(false);

/*function goToCheckout() {
  const route = useRoute();
  if (isEvent.value) {
    //use external booking url
    if (props.item.externalBookingUrl) {
      window.open(props.item.externalBookingUrl, "_blank");
      return;
    }
    //direct to checkout if only one ticket type
    if (props.item.tickets.length === 1) {
      useCheckoutRedirect().redirectToCheckout({
        id: props.item.tickets[0].id,
        tenantId: props.item.tickets[0].tenantId,
        start: route.query.start,
        end: route.query.end,
      });
    } else {
      openEventTicketOptions.value = true;
    }
  }

  if (!isEvent.value && !props.isNotBookable) {
    useCheckoutRedirect().redirectToCheckout({
      id: props.item.id,
      tenantId: props.item.tenantId,
      start: route.query.start,
      end: route.query.end,
    });
  }
}
 */

function goToDetails() {
  const route = useRoute();
  const router = useRouter();
  const basePath = route.path;
  console.log("goToDetails", basePath);

  if (basePath.includes("bookables")) {
    router.push(tenantTo(`bookables/${props.item.id}`));
  } else if (basePath.includes("locations")) {
    router.push(tenantTo(`locations/${props.item.id}`));
  } else if(basePath.includes("events")) {
    router.push(tenantTo(`events/${props.item.id}`));
  }
}

</script>

<style scoped></style>

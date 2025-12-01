<template>
  <div
    class="shadow-lg h-full bg-white dark:bg-gray-700 rounded-xl"
    :class="isNotBookable ? 'opacity-70 dark:opacity-50' : 'cursor-pointer'"
    @click="goToCheckout"
  >
    <div id="header" class="flex flex-col h-36">
      <div class="flex h-9/10">
        <img
          v-if="!isEvent && item?.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(item?.imgUrl)}`"
          alt="Bild des Buchungsobjekts"
          class="w-full object-cover rounded-t-xl"
        >
        <img
          v-else-if="isEvent && item?.information?.teaserImage"
          :src="`/api/img?url=${encodeURIComponent(item.information.teaserImage)}`"
          alt=""
          class="w-full object-cover rounded-t-xl"
        >
        <img
          v-else
          src="../../assets/bookable-default.jpg"
          alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
          class="w-full object-cover rounded-t-xl"
        >
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
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import ResultCardBookableContent from "~/components/search/ResultCardBookableContent.vue";
import ResultCardEventContent from "~/components/search/ResultCardEventContent.vue";

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

const openEventTicketOptions = ref(false);
function goToCheckout() {
  const route = useRoute();
  if (isEvent.value) {
    //use external booking url
    if (props.item.externalBookingUrl) {
      window.open(props.item.externalBookingUrl, "_blank");
      return;
    }
    //direct to checkout if only one ticket type
    if (props.item.tickets.length === 1) {
      useCheckoutRedirect().redirectToCheckout(
        props.item.tickets[0].id,
        props.item.tickets[0].tenantId,
        route.query.start || null,
        route.query.end || null,
      );
    } else {
      openEventTicketOptions.value = true;
    }
  }

  if (!isEvent.value && !props.isNotBookable) {
    useCheckoutRedirect().redirectToCheckout(
      props.item.id,
      props.item.tenantId,
      route.query.start || null,
      route.query.end || null,
    );
  }
}
</script>

<style scoped></style>

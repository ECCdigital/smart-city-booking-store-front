<template>
  <div
    class="shadow-lg bg-white dark:bg-gray-700 rounded-xl"
    :class="isNotBookable ? 'opacity-70 dark:opacity-50' : 'cursor-pointer'"
    @click="goToCheckout"
  >
    <div id="header" class="flex flex-col h-36">
      <div class="flex h-9/10 relative">
        <UBadge
          v-if="entryPageMode"
          class="absolute top-2 left-2 z-10"
          color="primary"
          size="md"
          :label="categoryName"
        />
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
        <ClientOnly v-else>
          <ImagePlaceholder :theme="theme" class="w-full h-full rounded-t-xl" />
        </ClientOnly>
      </div>
      <USeparator color="primary" type="solid" size="xl" class="w-full" />
    </div>

    <ResultCardBookableContent
      v-if="!isEvent"
      :bookable="item"
      :calculated-price="calculatedPrice"
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
    />
    <ResultCardEventContent
      v-if="isEvent"
      v-model:open-ticket-options="openEventTicketOptions"
      :event="item"
      :is-not-bookable="isNotBookable"
      :entry-page-mode="entryPageMode"
    />
  </div>
</template>
<script setup>
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import ResultCardBookableContent from "~/components/search/ResultCardBookableContent.vue";
import ResultCardEventContent from "~/components/search/ResultCardEventContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";

const colorMode = useColorMode();

const theme = computed(() => {
  if (colorMode.value === "dark") return "dark";
  if (colorMode.value === "light") return "light";
  return "light";
});

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
  entryPageMode: {
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
//toDo - read dynamically from instance
const categoryName = computed(() => {
  switch (props.item?.category) {
    case "room":
      return "Räume";
    case "location":
      return "Veranstaltungsorte";
    case "resource":
      return "Geräte";
    case "event":
      return "Veranstaltungen";
    default:
      return "";
  }
});

const { tenantTo } = useTenantRoute();


const openEventTicketOptions = ref(false);
function goToCheckout() {
  if (!props.entryPageMode) {
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
  } else {
    const router = useRouter();
    router.push(tenantTo(`events/${props.item.id}`));
  }
}
</script>

<style scoped></style>

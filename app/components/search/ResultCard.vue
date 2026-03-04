<template>
  <div
    class="shadow-lg bg-white dark:bg-gray-700 rounded-xl"
    :class="isNotBookable ? 'opacity-70 dark:opacity-50' : 'cursor-pointer'"
    @click="goToDetails()"
  >
    <div id="header" class="flex flex-col h-36">
      <div class="flex h-9/10 relative">
        <BookableTypeBadge
          :type="item?.type"
          :is-event="isEvent"
          class="absolute top-2 left-2"
        />
        <img
          v-if="!isEvent && item?.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(item?.imgUrl)}`"
          alt="Bild des Buchungsobjekts"
          class="w-full object-cover rounded-t-xl"
        >
        <img
          v-else-if="isEvent && item?.information?.teaserImage"
          :src="`/api/img?url=${encodeURIComponent(
            item.information.teaserImage,
          )}`"
          alt=""
          class="w-full object-cover rounded-t-xl"
        >
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
import ResultCardBookableContent from "~/components/search/ResultCardBookableContent.vue";
import ResultCardEventContent from "~/components/search/ResultCardEventContent.vue";
import ImagePlaceholder from "~/components/placeholder/ImagePlaceholder.vue";
import BookableTypeBadge from "~/components/bookables/BookableTypeBadge.vue";

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
  return props.item.type === "event";
});


const { tenantTo } = useTenantRoute();

const openEventTicketOptions = ref(false);

function goToDetails() {
  const route = useRoute();
  const router = useRouter();
  const basePath = route.path;

  //TODO - Wir sollten dynamisch den Typ ermitteln und nicht über den Pfad gehen

  if (props.entryPageMode) {
    if (props.item.category === "event") {
      router.push(tenantTo(`events/${props.item.id}`));
    } else if (props.item.category === "location") {
      router.push(tenantTo(`locations/${props.item.id}`));
    } else {
      router.push(tenantTo(`bookables/${props.item.id}`));
    }
  } else {
    if (basePath.includes("bookables")) {
      router.push(tenantTo(`bookables/${props.item.id}`));
    } else if (basePath.includes("locations")) {
      router.push(tenantTo(`locations/${props.item.id}`));
    } else if (basePath.includes("events")) {
      router.push(tenantTo(`events/${props.item.id}`));
    }
  }
}
</script>

<style scoped></style>

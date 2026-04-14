<template>
  <div>
    <div class="flex">
      <div class="grid place-content-center">
        <UIcon name="i-lucide-map-pin" class="size-5" />
      </div>
      <div v-if="hasAdress" class="p-3">
        {{ displayAddress() }}
      </div>
      <div v-else class="italic p-3">Keine Adresse bekannt.</div>

      <div class="flex-1" />
      <div
        v-if="hasAdress && enableCopyButton"
        class="grid place-content-center"
      >
        <UIcon
          name="i-lucide-copy"
          class="size-5 cursor-pointer"
          @click="copyAddressToClipboard"
        />
      </div>
    </div>
    <div class="text-red-500 text-xs">
      {{event}}</div>
    <p v-if="showDistance && hasLocationParam && hasAdress">
      <UIcon name="i-lucide-navigation" class="size-5" />
      <span v-if="distance" class="p-3">{{ distance }} km </span>
      <span v-else class="italic p-3">Distanz nicht ermittelbar. </span>
    </p>
  </div>
</template>
<script setup>
import {useRoute} from "#imports";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  enableCopyButton: {
    type: Boolean,
    default: false,
  },
  showDistance: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const hasLocationParam = computed(() => {
  return route.query.loc !== undefined;
});

const hasAdress = computed(() => {
  return !Object.values(props.event.eventAddress).every(
    (value) => value === null || value === undefined || value === "",
  );
});

const displayAddress = () => {
  return (
    props.event.eventAddress.street +
    " " +
    props.event.eventAddress.houseNumber +
    ", " +
    props.event.eventAddress.zip +
    " " +
    props.event.eventAddress.city
  );
};

const distance = computed(() => {
  return props.event.distanceMeter
    ? (props.event.distanceMeter / 1000).toFixed(2).replace(".", ",")
    : null;
});

const copyAddressToClipboard = async () => {
  if (hasAdress.value) {
    await navigator.clipboard.writeText(displayAddress());
    const notification = useNotification();
    notification.success(
      "Die Adresse wurde in Ihre Zwischenablage kopiert.",
      "Adresse erfolgreich kopiert!",
    );
  }
};
</script>

<style scoped></style>

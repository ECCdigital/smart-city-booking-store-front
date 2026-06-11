<template>
  <div>
    <div class="flex">
      <div class="grid place-content-center">
        <UIcon name="i-lucide-map-pin" class="size-5" />
      </div>
      <div v-if="location.length" class="p-3">{{ location }}</div>
      <div v-else class="italic p-3">Keine Adresse bekannt.</div>

      <div class="flex-1" />
      <div
        v-if="location.length && enableCopyButton"
        class="grid place-content-center"
      >
        <UIcon
          name="i-lucide-copy"
          class="size-5 cursor-pointer"
          @click="copyAddressToClipboard"
        />
      </div>
    </div>

    <p v-if="showDistance && hasLocationParam && location.length">
      <UIcon name="i-lucide-navigation" class="size-5" />
      <span v-if="distance" class="p-3">{{ distance }} km </span>
      <span v-else class="italic p-3">Distanz nicht ermittelbar. </span>
    </p>
  </div>
</template>
<script setup>
import { useRoute } from "#imports";

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

const location = computed(() => {
  if (typeof props.event.location === "string") {
    return props.event.location;
  } else if (
    props.event.location &&
    typeof props.event.location === "object"
  ) {
    return props.event.location.display_address || "";
  } else {
    return "";
  }
});

const distance = computed(() => {
  if (props.event.distanceMeter == null) return null;
  return (props.event.distanceMeter / 1000)
    .toFixed(2)
    .replace(".", ",")
    .replace(/,00$/, "");
});

const copyAddressToClipboard = async () => {
  if (location.value.length) {
    await navigator.clipboard.writeText(location.value);
    const notification = useNotification();
    notification.success(
      "Die Adresse wurde in Ihre Zwischenablage kopiert.",
      "Adresse erfolgreich kopiert!"
    );
  }
};
</script>

<style scoped></style>

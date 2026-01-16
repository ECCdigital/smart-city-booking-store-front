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
      <div v-if="hasAdress && enableCopyButton" class="grid place-content-center">
        <UIcon name="i-lucide-copy" class="size-5 cursor-pointer" @click="copyAddressToClipboard"/>
      </div>
    </div>
    <!--
    <p v-if="hasAdress">
      <UIcon name="i-lucide-navigation" class="size-5" />
      <span class="p-3">Distance coming soon </span>
    </p>
    -->
  </div>
</template>
<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  enableCopyButton: {
    type: Boolean,
    default: false,
  },
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

const copyAddressToClipboard = async () => {
  if (hasAdress.value) {
    await navigator.clipboard.writeText(displayAddress());
    const notification = useNotification();
    notification.success(
        "Die Adresse wurde in Ihre Zwischenablage kopiert.",
        "Adresse erfolgreich kopiert!"
    );
  }
};
</script>

<style scoped></style>

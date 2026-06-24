<template>
  <div class="flex w-full items-center gap-2 justify-between">
    <AccessPointLabel
      :access-point="accessPoint"
      :is-open="accessPointStatus?.open"
      :is-locked="accessPointStatus?.locked"
    />
    <UButton
      trailing-icon="i-lucide-x"
      variant="ghost"
      color="primary"
      size="md"
      @click="() => emit('close')"
    />
  </div>
</template>
<script setup>
import AccessPointLabel from "~/components/mobileKey/AccessPointLabel.vue";

const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  accessPointStatus: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["close"]);
</script>

<style scoped></style>
